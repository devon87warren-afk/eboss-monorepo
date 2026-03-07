
import { FlightOption, HotelOption, TripProposal, TravelProfile } from '../types';

// Mock Services mimicking Real GDS Connectors (Amadeus/Duffel)

export class FlightSearchService {
    private static airlines = ['Delta', 'United', 'Southwest', 'Alaska', 'American'];

    static async searchFlights(
        origin: string,
        destination: string,
        date: string,
        preferences: TravelProfile
    ): Promise<FlightOption[]> {
        // Logic: D-1 / D+1 is handled by the caller. This searches specific date.

        // Mock logic: Generate flights
        const results: FlightOption[] = [];
        const preferredAirlines = preferences.loyaltyPrograms
            .filter(p => p.providerType === 'airline')
            .map(p => p.providerName);

        // Generate 3-5 options
        for (let i = 0; i < 4; i++) {
            const airline = preferredAirlines.length > 0 && Math.random() > 0.3
                ? preferredAirlines[Math.floor(Math.random() * preferredAirlines.length)]
                : this.airlines[Math.floor(Math.random() * this.airlines.length)];

            const hour = 6 + Math.floor(Math.random() * 14); // 6 AM to 8 PM

            results.push({
                id: `FL-${destination}-${i}`,
                airline,
                flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + Math.floor(Math.random() * 900)}`,
                origin,
                destination,
                departureTime: `${date}T${hour.toString().padStart(2, '0')}:30:00`,
                arrivalTime: `${date}T${(hour + 4).toString().padStart(2, '0')}:45:00`, // Assume 4hr flight
                price: 250 + Math.floor(Math.random() * 300),
                cabin: 'economy',
                duration: '4h 15m'
            });
        }

        return results.sort((a, b) => a.price - b.price);
    }
}

export class HotelSearchService {
    private static hotelBrands = ['Marriott', 'Hilton', 'IHG', 'Hyatt'];

    static async searchHotels(
        locationCoordinates: { lat: number; lng: number }, // Work location
        airportCoordinates: { lat: number; lng: number },  // Airport location
        checkIn: string,
        checkOut: string,
        preferences: TravelProfile
    ): Promise<HotelOption[]> {

        // Logic: 10 Mile Rule
        // Calculate distance between Work and Airport
        // For mock, we simply simulate the result of that calculation

        const distanceToAirport = Math.random() * 20; // Random distance 0-20 miles
        const prioritizeJobSite = distanceToAirport > 10;

        console.log(`[Gemini Logic] Work is ${distanceToAirport.toFixed(1)} miles from Airport. Strategy: ${prioritizeJobSite ? 'Near Job Site' : 'Near Airport'}`);

        const results: HotelOption[] = [];
        const preferredHotels = preferences.loyaltyPrograms
            .filter(p => p.providerType === 'hotel')
            .map(p => p.providerName);

        for (let i = 0; i < 3; i++) {
            const brand = preferredHotels.length > 0 && Math.random() > 0.3
                ? preferredHotels[Math.floor(Math.random() * preferredHotels.length)]
                : this.hotelBrands[Math.floor(Math.random() * this.hotelBrands.length)];

            results.push({
                id: `HT-${i}`,
                name: `${brand} ${prioritizeJobSite ? 'Business Suites' : 'Airport Inn'}`,
                brand,
                address: prioritizeJobSite ? '123 Job Site Blvd' : '456 Airport Way',
                distanceFromWork: prioritizeJobSite ? 1.5 : distanceToAirport,
                distanceFromAirport: prioritizeJobSite ? distanceToAirport : 1.2,
                pricePerNight: 140 + Math.floor(Math.random() * 100),
                rating: 4 + Math.random(),
                imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
            });
        }

        return results;
    }
}
