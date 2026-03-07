const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  collection,
} = require("firebase/firestore");

const RULES_PATH = path.resolve(__dirname, "../../firestore.rules");
const PROJECT_ID = process.env.GCLOUD_PROJECT || "openai-mapset-eboss-map";
const ACTIVE_UID = "active-user";
const HAS_FIRESTORE_EMULATOR = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function emulatorHostConfig() {
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, portRaw] = hostPort.split(":");
  return { host, port: Number(portRaw || "8080") };
}

async function seedWithRulesDisabled(testEnv, writer) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await writer(context.firestore());
  });
}

const rulesMatrixSuite = HAS_FIRESTORE_EMULATOR ? describe : describe.skip;

rulesMatrixSuite("firestore.rules auth matrix", () => {
  let testEnv;

  beforeAll(async () => {
    const { host, port } = emulatorHostConfig();
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host,
        port,
        rules: fs.readFileSync(RULES_PATH, "utf8"),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "users", ACTIVE_UID), {
        role: "tech",
        status: "active",
      });
      await setDoc(doc(db, "sites", "site-1"), {
        name: "Site 1",
        status: "active",
      });
      await setDoc(doc(db, "projects", "project-1"), {
        name: "Project 1",
        visibility: "internal",
      });
    });
  });

  function activeDb() {
    return testEnv.authenticatedContext(ACTIVE_UID, {
      email: "active@anacorp.com",
    }).firestore();
  }

  test("allows generator read when siteId points to existing /sites doc", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-site-read"), {
        siteId: "site-1",
        label: "G1",
        kw: 100,
      });
    });

    await assertSucceeds(getDoc(doc(activeDb(), "generators", "gen-site-read")));
  });

  test("allows generator create with existing /sites siteId", async () => {
    await assertSucceeds(setDoc(doc(activeDb(), "generators", "gen-site-create"), {
      siteId: "site-1",
      label: "G2",
      kw: 125,
    }));
  });

  test("allows generator update when siteId is unchanged", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-site-update"), {
        siteId: "site-1",
        label: "Before",
        kw: 100,
      });
    });

    await assertSucceeds(updateDoc(doc(activeDb(), "generators", "gen-site-update"), {
      label: "After",
      kw: 110,
    }));
  });

  test("denies generator update when changing siteId", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "sites", "site-2"), {
        name: "Site 2",
        status: "active",
      });
      await setDoc(doc(db, "generators", "gen-site-reassign"), {
        siteId: "site-1",
        label: "Reassign",
        kw: 150,
      });
    });

    await assertFails(updateDoc(doc(activeDb(), "generators", "gen-site-reassign"), {
      siteId: "site-2",
    }));
  });

  test("allows generator delete for resolvable siteId", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-site-delete"), {
        siteId: "site-1",
        label: "Delete Me",
        kw: 80,
      });
    });

    await assertSucceeds(deleteDoc(doc(activeDb(), "generators", "gen-site-delete")));
  });

  test("denies generator read when siteId matches only /projects doc (sites-only)", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-project-read"), {
        siteId: "project-1",
        label: "Legacy Project Keyed",
        kw: 90,
      });
    });

    await assertFails(getDoc(doc(activeDb(), "generators", "gen-project-read")));
  });

  test("denies drawing create when siteId matches only /projects doc (sites-only)", async () => {
    const drawingRef = doc(activeDb(), "drawings", "draw-project-create");
    await assertFails(setDoc(drawingRef, {
      siteId: "project-1",
      type: "polygon",
      label: "Project keyed drawing",
      category: "existing",
      color: "#ff0000",
      // Minimal geometry so the write is rejected based on site resolution, not schema
      path: [{ lat: 32.4487, lng: -99.7331 }, { lat: 32.4490, lng: -99.7335 }],
    }));
  });

  test("allows drawing create with existing /sites siteId", async () => {
    const drawingRef = doc(activeDb(), "drawings", "draw-site-create");
    await assertSucceeds(setDoc(drawingRef, {
      siteId: "site-1",
      type: "polygon",
      label: "Site keyed drawing",
      category: "existing",
      color: "#00ff00",
      // Provide minimal geometry to satisfy validators
      path: [{ lat: 32.4487, lng: -99.7331 }, { lat: 32.4490, lng: -99.7335 }],
    }));
  });

  test("denies drawing update when siteId matches only /projects doc (sites-only)", async () => {
    // Ensure the document exists so the update is testing access not non-existence
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "drawings", "draw-project-update"), {
        siteId: "project-1",
        type: "polygon",
        label: "Project keyed drawing",
        category: "existing",
        color: "#ff0000",
        path: [{ lat: 32.4487, lng: -99.7331 }, { lat: 32.4490, lng: -99.7335 }],
      });
    });

    await assertFails(updateDoc(doc(activeDb(), "drawings", "draw-project-update"), {
      label: "Updated project keyed drawing",
    }));
  });

  test("allows reads for legacy missing/null siteId docs", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-null-site"), {
        siteId: null,
        label: "Legacy Null",
        kw: 70,
      });
      await setDoc(doc(db, "drawings", "draw-missing-site"), {
        type: "text",
        label: "Legacy Missing",
        category: "existing",
        color: "#00ff00",
      });
    });

    await assertSucceeds(getDoc(doc(activeDb(), "generators", "gen-null-site")));
    await assertSucceeds(getDoc(doc(activeDb(), "drawings", "draw-missing-site")));
  });

  test("denies creates for missing/null siteId", async () => {
    await assertFails(setDoc(doc(activeDb(), "generators", "gen-null-create"), {
      siteId: null,
      label: "Should Fail",
      kw: 60,
    }));

    await assertFails(setDoc(doc(activeDb(), "drawings", "draw-missing-create"), {
      type: "text",
      label: "Should Fail",
      category: "proposed",
      color: "#0000ff",
    }));
  });

  test("denies update/delete for legacy null siteId docs", async () => {
    await seedWithRulesDisabled(testEnv, async (db) => {
      await setDoc(doc(db, "generators", "gen-null-mutate"), {
        siteId: null,
        label: "Legacy Null Mutable",
        kw: 42,
      });
    });

    const legacyRef = doc(activeDb(), "generators", "gen-null-mutate");
    await assertFails(updateDoc(legacyRef, { label: "Mutate attempt" }));
    await assertFails(deleteDoc(legacyRef));
  });

  test("allows /sites query reads for active users", async () => {
    const sitesQuery = query(
      collection(activeDb(), "sites"),
      where("status", "==", "active")
    );
    await assertSucceeds(getDocs(sitesQuery));
  });
});
