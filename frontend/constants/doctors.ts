export interface Doctor {
  id: string;
  name: string;
  specialityKey: string; // Key for the language translation (e.g. "cardiologist")
  rating: number;
  reviews: number;
  experience: number;
  fees: number;
  imageUrl: string;
}

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc_1",
    name: "Dr. Ankit Sharma",
    specialityKey: "generalPhysician",
    rating: 4.8,
    reviews: 320,
    experience: 12,
    fees: 500,
    imageUrl: "https://i.pravatar.cc/150?u=doc1",
  },
  {
    id: "doc_2",
    name: "Dr. Priya Desai",
    specialityKey: "cardiologist",
    rating: 4.9,
    reviews: 450,
    experience: 15,
    fees: 1200,
    imageUrl: "https://i.pravatar.cc/150?u=doc2",
  },
  {
    id: "doc_3",
    name: "Dr. Rajesh Gupta",
    specialityKey: "orthopedic",
    rating: 4.7,
    reviews: 210,
    experience: 10,
    fees: 800,
    imageUrl: "https://i.pravatar.cc/150?u=doc3",
  },
  {
    id: "doc_4",
    name: "Dr. Sunita Verma",
    specialityKey: "dermatologist",
    rating: 4.6,
    reviews: 180,
    experience: 8,
    fees: 600,
    imageUrl: "https://i.pravatar.cc/150?u=doc4",
  },
  {
    id: "doc_5",
    name: "Dr. Amit Bansal",
    specialityKey: "pediatrician",
    rating: 4.8,
    reviews: 300,
    experience: 11,
    fees: 700,
    imageUrl: "https://i.pravatar.cc/150?u=doc5",
  },
  {
    id: "doc_6",
    name: "Dr. Kavita Singh",
    specialityKey: "dentist",
    rating: 4.5,
    reviews: 150,
    experience: 6,
    fees: 400,
    imageUrl: "https://i.pravatar.cc/150?u=doc6",
  },
];
