// Setup mocks before requiring functions
const mockMessagesCreate = jest.fn();

jest.mock("@google-cloud/secret-manager", () => ({
  SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
    accessSecretVersion: jest.fn().mockResolvedValue([{
      payload: { data: Buffer.from("test-anthropic-key-12345") },
    }]),
  })),
}));

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(),
  storage: jest.fn(),
}));

jest.mock("firebase-functions", () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
      }
    },
    onCall: jest.fn((handler) => handler),
    onRequest: jest.fn((optionsOrHandler, handler) => handler || optionsOrHandler),
  },
  firestore: {
    document: jest.fn((path) => ({
      onUpdate: jest.fn((handler) => handler),
      onCreate: jest.fn((handler) => handler),
      onDelete: jest.fn((handler) => handler),
    })),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  }));
});

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");

function reloadFunctions() {
  delete require.cache[require.resolve("../index.js")];
  return require("../index.js");
}

// Shared auth context for anacorp.com users (required now that siteCreate/Edit/Delete call validateAnaUser)
const ANA_SITE_AUTH = { auth: { uid: "user-123", token: { email: "user@anacorp.com" } } };

// Test suite
describe("Cloud Functions", () => {
  let mockDb;
  let mockStorage;
  let mockBucket;
  let mockFile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessagesCreate.mockClear();

    // Setup Firestore mocks
    mockDb = {
      collection: jest.fn((collectionName) => {
        throw new Error(`Unexpected mockDb.collection call for "${collectionName}". Test must mock this collection.`);
      }),
    };

    // Setup Storage mocks
    mockFile = {
      delete: jest.fn().mockResolvedValue(undefined),
    };
    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
    };
    mockStorage = {
      bucket: jest.fn().mockReturnValue(mockBucket),
    };

    admin.firestore.mockReturnValue(mockDb);
    admin.storage.mockReturnValue(mockStorage);
    admin.firestore.FieldValue = {
      serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
    };

    process.env.GCLOUD_PROJECT = "openai-mapset-eboss-map";
  });

  describe("siteCreate", () => {
    it("rejects unauthenticated callers", async () => {
      const { siteCreate } = require("../index.js");
      await expect(
        siteCreate({ name: "Test Site" }, { auth: null })
      ).rejects.toMatchObject({ code: "unauthenticated" });
    });

    it("rejects callers from non-anacorp.com domain", async () => {
      const { siteCreate } = require("../index.js");
      await expect(
        siteCreate(
          { name: "Test Site" },
          { auth: { uid: "ext-user", token: { email: "attacker@evil.com" } } }
        )
      ).rejects.toMatchObject({ code: "permission-denied" });
    });

    it("creates a site with valid name", async () => {
      const mockCollectionRef = {
        add: jest.fn().mockResolvedValue({ id: "site-123" }),
      };
      mockDb.collection.mockReturnValue(mockCollectionRef);

      // Load the function
      const { siteCreate } = require("../index.js");

      const result = await siteCreate(
        { name: "Test Site", address: "123 Main St", lat: 32.4487, lng: -99.7331 },
        ANA_SITE_AUTH
      );

      expect(result).toEqual({ success: true, siteId: "site-123" });
      expect(mockCollectionRef.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Site",
          address: "123 Main St",
          latitude: 32.4487,
          longitude: -99.7331,
          status: "active",
        })
      );
    });

    it("rejects empty site name", async () => {
      const { siteCreate } = require("../index.js");

      try {
        await siteCreate({ name: "" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("1-100 characters");
      }
    });

    it("rejects site name > 100 characters", async () => {
      const { siteCreate } = require("../index.js");
      const longName = "x".repeat(101);

      try {
        await siteCreate({ name: longName }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
      }
    });

    it("rejects invalid latitude", async () => {
      const { siteCreate } = require("../index.js");

      try {
        await siteCreate({ name: "Test", lat: "invalid" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Latitude must be a number");
      }
    });

    it("rejects invalid longitude", async () => {
      const { siteCreate } = require("../index.js");

      try {
        await siteCreate({ name: "Test", lng: "invalid" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Longitude must be a number");
      }
    });
  });

  describe("siteEdit", () => {
    it("updates site name", async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const { siteEdit } = require("../index.js");

      const result = await siteEdit(
        { siteId: "site-123", updates: { name: "Updated Site" } },
        ANA_SITE_AUTH
      );

      expect(result).toEqual({ success: true });
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Updated Site" })
      );
    });

    it("updates latitude", async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const { siteEdit } = require("../index.js");

      const result = await siteEdit(
        { siteId: "site-123", updates: { latitude: 40.7128 } },
        ANA_SITE_AUTH
      );

      expect(result).toEqual({ success: true });
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 40.7128 })
      );
    });

    it("rejects missing siteId", async () => {
      const { siteEdit } = require("../index.js");

      try {
        await siteEdit({ updates: { name: "Test" } }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Site ID is required");
      }
    });

    it("rejects missing updates object", async () => {
      const { siteEdit } = require("../index.js");

      try {
        await siteEdit({ siteId: "site-123" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Updates object is required");
      }
    });

    it("rejects invalid latitude in update", async () => {
      const { siteEdit } = require("../index.js");

      try {
        await siteEdit(
          { siteId: "site-123", updates: { latitude: "invalid" } },
          ANA_SITE_AUTH
        );
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
      }
    });
  });

  describe("siteDelete", () => {
    it("soft-deletes site by archiving", async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const { siteDelete } = require("../index.js");

      const result = await siteDelete(
        { siteId: "site-123" },
        ANA_SITE_AUTH
      );

      expect(result).toEqual({ success: true });
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "archived" })
      );
    });

    it("rejects missing siteId", async () => {
      const { siteDelete } = require("../index.js");

      try {
        await siteDelete({}, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Site ID is required");
      }
    });

    it("rejects empty siteId", async () => {
      const { siteDelete } = require("../index.js");

      try {
        await siteDelete({ siteId: "" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
      }
    });

    it("handles database errors gracefully", async () => {
      const mockDocRef = {
        update: jest.fn().mockRejectedValue(new Error("Firestore down")),
      };
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const { siteDelete } = require("../index.js");

      try {
        await siteDelete({ siteId: "site-123" }, ANA_SITE_AUTH);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("internal");
        expect(error.message).toContain("Failed to delete site");
      }
    });
  });

  describe("hardDeleteArchivedSite trigger", () => {
    it("deletes generators from flat collection when site is archived", async () => {
      const mockGeneratorDelete = jest.fn().mockResolvedValue(undefined);
      const mockGeneratorDoc = {
        id: "gen-1",
        data: jest.fn().mockReturnValue({
          photoUrl: null,
          siteId: "site-123",
        }),
      };

      const mockSiteDelete = jest.fn().mockResolvedValue(undefined);
      const mockSiteDoc = {
        delete: mockSiteDelete,
      };

      mockDb.collection
        .mockImplementation((collectionName) => {
          if (collectionName === "generators") {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [mockGeneratorDoc],
                }),
              }),
              doc: jest.fn().mockReturnValue({
                delete: mockGeneratorDelete,
              }),
            };
          } else if (collectionName === "drawings") {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [],
                }),
              }),
            };
          } else if (collectionName === "sites") {
            return {
              doc: jest.fn().mockReturnValue(mockSiteDoc),
            };
          }
        });

      const { hardDeleteArchivedSite } = require("../index.js");

      const change = {
        before: { data: () => ({ status: "active" }) },
        after: { data: () => ({ status: "archived" }) },
      };

      await hardDeleteArchivedSite(change, { params: { siteId: "site-123" } });

      // Verify operations occurred
      expect(mockDb.collection).toHaveBeenCalledWith("generators");
      expect(mockDb.collection).toHaveBeenCalledWith("drawings");
      expect(mockDb.collection).toHaveBeenCalledWith("sites");
      expect(mockSiteDelete).toHaveBeenCalled();
    });

    it("skips hard delete if not transitioning to archived", async () => {
      const { hardDeleteArchivedSite } = require("../index.js");

      const change = {
        before: { data: () => ({ status: "active" }) },
        after: { data: () => ({ status: "active" }) },
      };

      await hardDeleteArchivedSite(change, { params: { siteId: "site-123" } });

      // Should not call any deletes
      expect(mockDb.collection).not.toHaveBeenCalled();
    });

    it("handles deleted photo from storage gracefully", async () => {
      const mockGeneratorDelete = jest.fn().mockResolvedValue(undefined);
      const mockGeneratorDoc = {
        id: "gen-1",
        data: jest.fn().mockReturnValue({
          photoUrl: "https://storage.googleapis.com/bucket/o/photo.jpg?alt=media",
          siteId: "site-123",
        }),
      };

      const mockSiteDelete = jest.fn().mockResolvedValue(undefined);
      const mockSiteDoc = {
        delete: mockSiteDelete,
      };

      mockDb.collection
        .mockImplementation((collectionName) => {
          if (collectionName === "generators") {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [mockGeneratorDoc],
                }),
              }),
              doc: jest.fn().mockReturnValue({
                delete: mockGeneratorDelete,
              }),
            };
          } else if (collectionName === "drawings") {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [],
                }),
              }),
            };
          } else if (collectionName === "sites") {
            return {
              doc: jest.fn().mockReturnValue(mockSiteDoc),
            };
          }
        });

      mockFile.delete.mockRejectedValue(new Error("File not found"));

      const { hardDeleteArchivedSite } = require("../index.js");

      const change = {
        before: { data: () => ({ status: "active" }) },
        after: { data: () => ({ status: "archived" }) },
      };

      // Should not throw even if file delete fails
      await hardDeleteArchivedSite(change, { params: { siteId: "site-123" } });

      expect(mockSiteDelete).toHaveBeenCalled();
    });
  });

  describe("onGeneratorCreate trigger", () => {
    it("writes CREATE audit log entry when a generator is created", async () => {
      const mockAuditAdd = jest.fn().mockResolvedValue({ id: "audit-1" });
      mockDb.collection.mockImplementation((collectionName) => {
        if (collectionName === "auditLogs") {
          return { add: mockAuditAdd };
        }
        throw new Error(`Unexpected collection: ${collectionName}`);
      });

      const { onGeneratorCreate } = reloadFunctions();

      const snap = {
        data: jest.fn().mockReturnValue({
          label: "EBOSS-125-042",
          kw: 100,
          latitude: 32.4487,
          longitude: -99.7331,
          siteId: "site-123",
          createdBy: "user-123",
        }),
      };
      const context = { params: { generatorId: "gen-123" } };

      await onGeneratorCreate(snap, context);

      expect(mockAuditAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          resourceType: "generator",
          resourceId: "gen-123",
        })
      );
    });

    it("does not throw when audit log write fails", async () => {
      const mockAuditAdd = jest.fn().mockRejectedValue(new Error("Write failed"));
      mockDb.collection.mockImplementation((collectionName) => {
        if (collectionName === "auditLogs") return { add: mockAuditAdd };
        throw new Error(`Unexpected collection: ${collectionName}`);
      });

      // Reload functions to pick up mocks
      const { onGeneratorCreate } = reloadFunctions();

      const snap = {
        data: jest.fn().mockReturnValue({
          label: "EBOSS-125-042",
          kw: 100,
          latitude: 32.4487,
          longitude: -99.7331,
          siteId: "site-123",
          createdBy: "user-123",
        }),
      };
      const context = { params: { generatorId: "gen-fail" } };

      // Should resolve and return undefined (function catches/logs audit errors)
      await expect(onGeneratorCreate(snap, context)).resolves.toBeUndefined();
      expect(mockAuditAdd).toHaveBeenCalled();
    });
  });

  describe("onGeneratorDelete trigger", () => {
    it("writes DELETE audit log entry when a generator is deleted", async () => {
      const mockAuditAdd = jest.fn().mockResolvedValue({ id: "audit-2" });
      mockDb.collection.mockImplementation((collectionName) => {
        if (collectionName === "auditLogs") {
          return { add: mockAuditAdd };
        }
        throw new Error(`Unexpected collection: ${collectionName}`);
      });

      const { onGeneratorDelete } = reloadFunctions();

      const snap = {
        data: jest.fn().mockReturnValue({
          label: "EBOSS-125-042",
          siteId: "site-123",
        }),
      };
      const context = { params: { generatorId: "gen-123" } };

      await onGeneratorDelete(snap, context);

      expect(mockAuditAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          resourceType: "generator",
          resourceId: "gen-123",
        })
      );
    });

    it("does not throw when audit log write fails", async () => {
      const mockAuditAdd = jest.fn().mockRejectedValue(new Error("Write failed"));
      mockDb.collection.mockImplementation((collectionName) => {
        if (collectionName === "auditLogs") return { add: mockAuditAdd };
        throw new Error(`Unexpected collection: ${collectionName}`);
      });

      // Reload functions to pick up mocks
      const { onGeneratorDelete } = reloadFunctions();

      const snap = {
        data: jest.fn().mockReturnValue({
          label: "EBOSS-125-042",
          siteId: "site-123",
        }),
      };
      const context = { params: { generatorId: "gen-fail" } };

      // Should resolve and return undefined (function catches/logs audit errors)
      await expect(onGeneratorDelete(snap, context)).resolves.toBeUndefined();
      expect(mockAuditAdd).toHaveBeenCalled();
    });
  });

  describe("suggestAssetName", () => {
    const ANA_TEST_UID = "ana-user-123";
    const ANA_TEST_EMAIL = "tech@anacorp.com";
    const anaAuthContext = { auth: { uid: ANA_TEST_UID, token: { email: ANA_TEST_EMAIL } } };

    it("rejects request without authentication", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName({ fileName: "test.jpg" }, { auth: null });
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("unauthenticated");
      }
    });

    it("rejects non-ANA email domains", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName(
          { fileName: "test.jpg", metadata: { make: "ANA" } },
          { auth: { uid: "user-123", token: { email: "user@example.com" } } }
        );
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("permission-denied");
        expect(error.message).toContain("anacorp.com");
      }
    });

    it("validates fileName for authenticated users", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName(
          { metadata: { make: "ANA" } },
          anaAuthContext
        );
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("fileName");
      }
    });

    it("rejects missing email on auth token", async () => {
      const { suggestAssetName } = require("../index.js");

      await expect(
        suggestAssetName(
          { fileName: "test.jpg", metadata: { make: "ANA" } },
          { auth: { uid: "user-123", token: {} } }
        )
      ).rejects.toMatchObject({ code: "failed-precondition" });
    });

    it("rejects missing fileName", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName({ metadata: { make: "Canon" } }, anaAuthContext);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("fileName");
      }
    });

    it("rejects invalid metadata object", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName({ fileName: "test.jpg", metadata: null }, anaAuthContext);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("metadata");
      }
    });

    it("rejects empty imageBase64", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName({ fileName: "test.jpg", imageBase64: "" }, anaAuthContext);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("imageBase64");
      }
    });

    it("rejects request with neither metadata nor imageBase64", async () => {
      const { suggestAssetName } = require("../index.js");

      try {
        await suggestAssetName({ fileName: "test.jpg" }, anaAuthContext);
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("Provide at least metadata or imageBase64");
      }
    });

    it("returns valid suggestion with metadata", async () => {
      // Mock returns a valid EBOSS-style suggestion
      mockMessagesCreate.mockResolvedValue({
        content: [{ text: "EBOSS-125-042" }],
      });

      const { suggestAssetName } = reloadFunctions();

      const result = await suggestAssetName(
        {
          fileName: "gen.jpg",
          metadata: { make: "ANA", model: "EBOSS-125", gps: { lat: 32.4487, lng: -99.7331 } },
        },
        anaAuthContext
      );

      expect(result).toEqual({ success: true, suggestion: "EBOSS-125-042", kw: null });
    });

    it("extracts kw value from vision pass JSON response", async () => {
      // First call (vision pass): returns JSON with kw info
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ text: '{"assetNumber":"042","capacity":"100kW","model":"EBOSS-125","kw":100}' }],
      });
      // Second call (naming pass): returns the suggestion
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ text: "EBOSS-125-000042" }],
      });

      const { suggestAssetName } = reloadFunctions();

      const result = await suggestAssetName(
        {
          fileName: "gen.jpg",
          imageBase64: "dGVzdA==",
          mimeType: "image/jpeg",
        },
        { auth: { uid: "user-123", token: { email: "user@anacorp.com" } } }
      );

      expect(result).toEqual({ success: true, suggestion: "EBOSS-125-000042", kw: 100 });
    });

    it("normalizes suggestion to uppercase with hyphens", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ text: "eboss_125_042" }],
      });

      const { suggestAssetName } = reloadFunctions();

      const result = await suggestAssetName(
        { fileName: "test.jpg", metadata: { make: "ANA" } },
        anaAuthContext
      );

      expect(result.suggestion).toBe("EBOSS-125-042");
    });

    it("returns fallback suggestion for invalid response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ text: "!!!" }], // invalid characters → fallback
      });

      const { suggestAssetName } = reloadFunctions();

      const result = await suggestAssetName(
        { fileName: "test.jpg", metadata: { make: "ANA" } },
        anaAuthContext
      );

      expect(result.suggestion).toBe("EBOSS-UNKNOWN");
    });

    it("handles API rate limit error", async () => {
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.status = 429;
      mockMessagesCreate.mockRejectedValueOnce(rateLimitError);

      const { suggestAssetName } = reloadFunctions();

      try {
        await suggestAssetName(
          { fileName: "test.jpg", metadata: { make: "Test" } },
          anaAuthContext
        );
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("internal");
        expect(error.details?.code).toBe("RATE_LIMIT");
      }
    });

    it("handles authentication error from API", async () => {
      const authError = new Error("Unauthorized");
      authError.status = 401;
      mockMessagesCreate.mockRejectedValueOnce(authError);

      const { suggestAssetName } = reloadFunctions();

      try {
        await suggestAssetName(
          { fileName: "test.jpg", metadata: { make: "Test" } },
          anaAuthContext
        );
        fail("Should have thrown error");
      } catch (error) {
        expect(error.code).toBe("internal");
        expect(error.details?.code).toBe("AUTH");
      }
    });
  });
});
