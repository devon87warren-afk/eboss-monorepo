/**
 * Trip Service Tests
 *
 * Tests for the tripService CRUD operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchTripProposals,
  fetchTripProposalById,
  createTripProposal,
  updateTripProposal,
  deleteTripProposal,
  fetchFlightOptions,
  createFlightOption,
  bookFlight,
  getSelectedFlight,
  TripServiceError,
} from './tripService';
import {
  createTripProposal as createMockTripProposal,
  createFlightOption as createMockFlightOption,
  resetMockCounters,
} from '@/test/mock-factories';

// Mock the supabase module
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

let mockIsConfigured = true;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => mockIsConfigured,
}));

describe('tripService', () => {
  beforeEach(() => {
    resetMockCounters();
    mockIsConfigured = true;
    vi.clearAllMocks();

    // Set up default mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      eq: vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // TRIP PROPOSAL FETCH TESTS
  // ============================================================================

  describe('fetchTripProposals', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(fetchTripProposals()).rejects.toThrow(TripServiceError);
      await expect(fetchTripProposals()).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('fetches all trip proposals', async () => {
      const mockData = [
        {
          ...createMockTripProposal(),
          customers: { name: 'Sunbelt Rentals' },
          flight_options: [createMockFlightOption()],
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchTripProposals();

      expect(mockFrom).toHaveBeenCalledWith('trip_proposals');
      expect(result).toHaveLength(1);
      expect(result[0].client_name).toBe('Sunbelt Rentals');
    });

    it('filters by user ID when provided', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await fetchTripProposals('user-123');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('transforms perks to array', async () => {
      const mockData = [
        {
          ...createMockTripProposal(),
          customers: null,
          flight_options: [
            { ...createMockFlightOption(), perks: 'not-an-array' },
          ],
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchTripProposals();

      expect(result[0].flight_options[0].perks).toEqual([]);
    });

    it('throws error on database failure', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      await expect(fetchTripProposals()).rejects.toThrow(TripServiceError);
    });
  });

  describe('fetchTripProposalById', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(fetchTripProposalById('trip-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('returns trip when found', async () => {
      const mockTrip = {
        ...createMockTripProposal(),
        customers: { name: 'Sunbelt Rentals' },
        flight_options: [],
      };
      mockSingle.mockResolvedValueOnce({ data: mockTrip, error: null });

      const result = await fetchTripProposalById('trip-1');

      expect(result).not.toBeNull();
      expect(result?.client_name).toBe('Sunbelt Rentals');
    });

    it('returns null when not found (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned', code: 'PGRST116' },
      });

      const result = await fetchTripProposalById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // TRIP PROPOSAL MUTATION TESTS
  // ============================================================================

  describe('createTripProposal', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        createTripProposal({
          user_id: 'user-1',
          destination: 'DC',
          start_date: '2024-02-12',
          end_date: '2024-02-14',
        })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('creates trip proposal successfully', async () => {
      const input = {
        user_id: 'user-1',
        destination: 'Washington DC',
        start_date: '2024-02-12',
        end_date: '2024-02-14',
        purpose: 'Client meeting',
      };
      const mockResult = createMockTripProposal(input);
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createTripProposal(input);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.destination).toBe('Washington DC');
    });
  });

  describe('updateTripProposal', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        updateTripProposal('trip-1', { status: 'approved' })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('updates trip proposal successfully', async () => {
      const mockResult = createMockTripProposal({ status: 'approved' });
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await updateTripProposal('trip-1', { status: 'approved' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.status).toBe('approved');
    });
  });

  describe('deleteTripProposal', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(deleteTripProposal('trip-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('deletes trip proposal successfully', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await expect(deleteTripProposal('trip-1')).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('trip_proposals');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // FLIGHT OPTIONS TESTS
  // ============================================================================

  describe('fetchFlightOptions', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(fetchFlightOptions('trip-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('fetches flight options ordered by price', async () => {
      const mockOptions = [
        createMockFlightOption({ price: 320 }),
        createMockFlightOption({ price: 450 }),
      ];
      mockOrder.mockResolvedValueOnce({ data: mockOptions, error: null });

      const result = await fetchFlightOptions('trip-1');

      expect(mockFrom).toHaveBeenCalledWith('flight_options');
      expect(result).toHaveLength(2);
    });

    it('transforms perks to array', async () => {
      const mockOptions = [
        { ...createMockFlightOption(), perks: 'invalid' },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockOptions, error: null });

      const result = await fetchFlightOptions('trip-1');

      expect(result[0].perks).toEqual([]);
    });
  });

  describe('createFlightOption', () => {
    it('creates flight option successfully', async () => {
      const input = {
        trip_id: 'trip-1',
        airline: 'Delta',
        price: 450,
        perks: ['Upgrade Eligible'],
      };
      const mockResult = createMockFlightOption(input);
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createFlightOption(input);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.airline).toBe('Delta');
    });
  });

  // ============================================================================
  // BOOKING TESTS
  // ============================================================================

  describe('bookFlight', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(
        bookFlight({ trip_id: 'trip-1', flight_id: 'flight-1' })
      ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    });

    it('books flight successfully', async () => {
      // Mock the chain for bookFlight
      const mockUpdateResult = { data: null, error: null };
      const mockFlightPrice = { data: { price: 450 }, error: null };
      const mockTripResult = createMockTripProposal({ status: 'booked', total_cost: 450 });

      // Reset and set up specific mocks for this test
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockUpdateResult),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTripResult, error: null }),
          }),
        }),
      });
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockFlightPrice),
        }),
      });

      const result = await bookFlight({ trip_id: 'trip-1', flight_id: 'flight-1' });

      expect(result.status).toBe('booked');
      expect(result.total_cost).toBe(450);
    });
  });

  describe('getSelectedFlight', () => {
    it('throws NOT_CONFIGURED error when Supabase is not configured', async () => {
      mockIsConfigured = false;

      await expect(getSelectedFlight('trip-1')).rejects.toMatchObject({
        code: 'NOT_CONFIGURED',
      });
    });

    it('returns selected flight when found', async () => {
      const mockFlight = createMockFlightOption({ is_selected: true });
      mockMaybeSingle.mockResolvedValueOnce({ data: mockFlight, error: null });

      const result = await getSelectedFlight('trip-1');

      expect(result).not.toBeNull();
      expect(result?.is_selected).toBe(true);
    });

    it('returns null when no flight selected', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getSelectedFlight('trip-1');

      expect(result).toBeNull();
    });
  });
});
