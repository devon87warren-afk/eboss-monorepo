
// Types for Gemini Travel System

export type ProviderType = 'airline' | 'hotel' | 'car';

export interface LoyaltyProgram {
    id: string;
    providerType: ProviderType;
    providerName: string; // 'Delta', 'Marriott'
    memberNumber: string;
    statusLevel?: string;
}

export interface TravelProfile {
    homeAirport: string;
    seatingPreference: 'aisle' | 'window' | 'any';
    mealPreference?: string;
    knownTravelerNumber?: string;
    loyaltyPrograms: LoyaltyProgram[];
}

export interface FlightOption {
    id: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    destination: string;
    price: number;
    cabin: 'economy' | 'business' | 'first';
    duration: string;
}

export interface HotelOption {
    id: string;
    name: string;
    brand: string;
    address: string;
    distanceFromWork: number; // miles
    distanceFromAirport: number; // miles
    pricePerNight: number;
    rating: number;
    imageUrl?: string;
}

export interface TripProposal {
    id: string;
    destination: string;
    dates: {
        start: string;
        end: string;
    };
    reason: string;
    flightOptions: {
        outbound: FlightOption[];
        return: FlightOption[];
    };
    hotelOptions: HotelOption[];
}
