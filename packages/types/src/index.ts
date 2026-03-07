// Shared entity types across all EBOSS apps
// Maps: Firestore generators ↔ Supabase units ↔ EBOSS_Tech_App Fleet

export interface Site {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Asset {
  id: string;
  siteId?: string;
  label: string;        // Display name / asset ID (e.g. "EBOSS-125-000042")
  kw: number;           // Capacity in kW
  lat: number;
  lng: number;
  project?: string;
  widthM?: number;
  lengthM?: number;
  orientationDeg?: number;
  photoUrl?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface Drawing {
  id: string;
  siteId?: string;
  type: 'polyline' | 'polygon' | 'rectangle' | 'circle' | 'text';
  label?: string;
  category: 'existing' | 'proposed';
  color?: string;
  strokeWeight?: number;
  path?: [number, number][];
  createdAt?: string;
}

export interface Ticket {
  id: string;
  assetId?: string;
  siteId?: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  territory?: string;
  createdAt: string;
}

export interface Territory {
  id: string;
  name: string;
  region?: string;
  managerId?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'tech' | 'viewer';
}
