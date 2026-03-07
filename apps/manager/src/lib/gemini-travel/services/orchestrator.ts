
import { TripProposal, TravelProfile } from '../types';
import { FlightSearchService, HotelSearchService } from './bookingEngine';

// The Orchestrator that combines everything
export class GeminiTravelOrchestrator {

    static async generateTripProposal(
        calendarEvent: { title: string; location: string; startDate: string; endDate: string },
        userProfile: TravelProfile
    ): Promise<TripProposal> {

        console.log(`[Gemini] Generating trip for event: ${calendarEvent.title} in ${calendarEvent.location}`);

        // 1. Calculate Dates (D-1 / D+1)
        const eventStart = new Date(calendarEvent.startDate);
        const eventEnd = new Date(calendarEvent.endDate);

        const flightOutDate = new Date(eventStart);
        flightOutDate.setDate(eventStart.getDate() - 1); // Day BEFORE

        const flightReturnDate = new Date(eventEnd);
        flightReturnDate.setDate(eventEnd.getDate() + 1); // Day AFTER

        // 2. Search Flights
        // Assuming Home Airport is LAX for mock
        const homeAirport = userProfile.homeAirport || 'LAX';
        // Mock extraction of airport code from location string
        const destAirport = this.extractAirportCode(calendarEvent.location) || 'DEN';

        const outboundFlights = await FlightSearchService.searchFlights(
            homeAirport,
            destAirport,
            flightOutDate.toISOString().split('T')[0],
            userProfile
        );

        const returnFlights = await FlightSearchService.searchFlights(
            destAirport,
            homeAirport,
            flightReturnDate.toISOString().split('T')[0],
            userProfile
        );

        // 3. Search Hotels
        // Mock Coordinates
        const workCoords = { lat: 39.7392, lng: -104.9903 }; // Denver
        const airportCoords = { lat: 39.8561, lng: -104.6737 }; // DEN Airport

        const hotels = await HotelSearchService.searchHotels(
            workCoords,
            airportCoords,
            flightOutDate.toISOString().split('T')[0],
            flightReturnDate.toISOString().split('T')[0],
            userProfile
        );

        return {
            id: `TRIP-${Date.now()}`,
            destination: calendarEvent.location,
            dates: {
                start: flightOutDate.toISOString(),
                end: flightReturnDate.toISOString()
            },
            reason: calendarEvent.title,
            flightOptions: {
                outbound: outboundFlights,
                return: returnFlights
            },
            hotelOptions: hotels
        };
    }

    private static extractAirportCode(location: string): string {
        // Mock Natural Language Processing
        if (location.includes('Denver')) return 'DEN';
        if (location.includes('New York')) return 'JFK';
        if (location.includes('Chicago')) return 'ORD';
        if (location.includes('Austin')) return 'AUS';
        return 'DEN'; // Default mock
    }
}
