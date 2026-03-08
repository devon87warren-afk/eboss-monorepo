/**
 * Technician Location Service Tests
 *
 * Tests for the technicianLocationService CRUD operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchTechnicianLocations,
  fetchTechnicianLocationByUserId,
  upsertTechnicianLocation,
  updateTechnicianLocation,
  deleteTechnicianLocation,
  subscribeToTechnicianLocations,
  TechnicianLocationServiceError,
} from './technicianLocationService';
import {
  createTechnicianLocation,
  // TODO(EBOSS-111, 2026-03-08): createTechnicianLocationWithProfile imported
  // for planned profile-aware test cases; suppress until those tests are added.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createTechnicianLocationWithProfile,
  createTravelingTechnician,
  resetMockCounters,
} from '@/test/mock-factories';

// Mock the supabase module
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockChannel = vi.fn();
const mockOn = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

let mockIsConfigured = true;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
  },
  isSupabaseConfigured: () => mockIsConfigured,
}));

describe('technicianLocationService', () => {
  beforeEach(() => {
    resetMockCounters();
    mockIsConfigured = true;
    vi.clearAllMocks();

    // Set up default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      delete: mockDelete,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      single: mockSingle,
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({ data: null, error: null });

    // Channel mocks
    mockChannel.mockReturnValue({
      on: mockOn,
    });
    mockOn.mockReturnValue({
      subscribe: mockSubscribe,
    });
    mockSubscribe.mockReturnValue({
      unsubscribe: mockUnsubscribe,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // FETCH TESTS
  // ============================================================================

  describe('fetchTechnicianLocations', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(fetchTechnicianLocations()).rejects.toThrow(
        TechnicianLocationServiceError
      );
      await expect(fetchTechnicianLocations()).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('fetches all technician locations', async () => {
      const mockData = [
        {
          ...createTechnicianLocation(),
          users: { name: 'Alex Tech' },
        },
        {
          ...createTechnicianLocation(),
          users: { name: 'Sarah Field' },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchTechnicianLocations();

      expect(mockFrom).toHaveBeenCalledWith('technician_locations');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alex Tech');
    });

    it('transforms flight data correctly', async () => {
      const travelingTech = createTravelingTechnician();
      const mockData = [
        {
          ...travelingTech,
          users: { name: 'Sarah Field' },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchTechnicianLocations();

      expect(result[0].flight).toEqual({
        from: 'DEN',
        to: 'DFW',
        progress: 60,
      });
    });

    it('handles null users', async () => {
      const mockData = [
        {
          ...createTechnicianLocation(),
          users: null,
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchTechnicianLocations();

      expect(result[0].name).toBe('Unknown Technician');
    });

    it('logs territory ID when provided (not yet implemented)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await fetchTechnicianLocations('west-coast');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Territory filtering not yet implemented:',
        'west-coast'
      );
    });

    it('throws error on database failure', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      await expect(fetchTechnicianLocations()).rejects.toThrow(
        TechnicianLocationServiceError
      );
    });
  });

  describe('fetchTechnicianLocationByUserId', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        fetchTechnicianLocationByUserId('user-1')
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('returns technician when found', async () => {
      const mockTech = {
        ...createTechnicianLocation(),
        users: { name: 'Alex Tech' },
      };
      mockSingle.mockResolvedValueOnce({ data: mockTech, error: null });

      const result = await fetchTechnicianLocationByUserId('user-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Alex Tech');
    });

    it('returns null when not found (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned', code: 'PGRST116' },
      });

      const result = await fetchTechnicianLocationByUserId('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error on other database errors', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'OTHER_ERROR' },
      });

      await expect(
        fetchTechnicianLocationByUserId('user-1')
      ).rejects.toThrow(TechnicianLocationServiceError);
    });
  });

  // ============================================================================
  // MUTATION TESTS
  // ============================================================================

  describe('upsertTechnicianLocation', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        upsertTechnicianLocation({ user_id: 'user-1' })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('upserts location successfully', async () => {
      const input = {
        user_id: 'user-1',
        latitude: 39.7,
        longitude: -105.0,
        status: 'Available' as const,
      };
      const mockResult = createTechnicianLocation(input);
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await upsertTechnicianLocation(input);

      expect(mockUpsert).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('throws error on upsert failure', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upsert failed', code: 'UPSERT_ERROR' },
      });

      await expect(
        upsertTechnicianLocation({ user_id: 'user-1' })
      ).rejects.toThrow(TechnicianLocationServiceError);
    });
  });

  describe('updateTechnicianLocation', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        updateTechnicianLocation('user-1', { status: 'On-Site' })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('updates location successfully', async () => {
      const mockResult = createTechnicianLocation({ status: 'On-Site' });
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await updateTechnicianLocation('user-1', {
        status: 'On-Site',
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.status).toBe('On-Site');
    });
  });

  describe('deleteTechnicianLocation', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(deleteTechnicianLocation('user-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('deletes location successfully', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await expect(deleteTechnicianLocation('user-1')).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('technician_locations');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // REAL-TIME SUBSCRIPTION TESTS
  // ============================================================================

  describe('subscribeToTechnicianLocations', () => {
    it('returns noop when Supabase is not configured', () => {
      mockIsConfigured = false;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const callback = vi.fn();
      const unsubscribe = subscribeToTechnicianLocations(callback);

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, real-time updates disabled'
      );
    });

    it('sets up channel subscription', () => {
      const callback = vi.fn();
      subscribeToTechnicianLocations(callback);

      expect(mockChannel).toHaveBeenCalledWith('technician_locations_changes');
      expect(mockOn).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTechnicianLocations(callback);

      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
