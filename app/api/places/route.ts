import { NextResponse } from "next/server";

const places = [
  {
    id: "cebu-heritage", name: "Cebu City heritage core", island: "CEBU", category: "Heritage", mood: "Old streets & stories",
    summary: "Take a slow walk through the historic center, where Cebu’s layered past still shows in its churches, streets, and landmarks.",
    officialUrl: "https://www.cebu.gov.ph/history/", mapQuery: "Cebu City heritage core Philippines",
  },
  {
    id: "bantayan", name: "Bantayan Island", island: "CEBU", category: "Island days", mood: "Beach & barangay life",
    summary: "A northern island escape with white-sand shores, a maritime history, and local traditions worth making time for.",
    officialUrl: "https://tourism.cebu.gov.ph/explore/bantayan/", mapQuery: "Bantayan Island Cebu Philippines",
  },
  {
    id: "moalboal", name: "Moalboal", island: "CEBU", category: "Coast & sea", mood: "Reef & salt air",
    summary: "A southwest Cebu coast known for marine life, coral reefs, and sea-centered community life. Check local marine guidance before entering the water.",
    officialUrl: "https://tourism.cebu.gov.ph/explore/moalboal/", mapQuery: "Moalboal Cebu Philippines",
  },
  {
    id: "loboc", name: "Loboc", island: "BOHOL", category: "Nature", mood: "River & heritage",
    summary: "Follow the river through a green inland town, then make space for its historic church, local food, and music heritage.",
    officialUrl: "https://tourism.bohol.gov.ph/visitbohol-loboc/", mapQuery: "Loboc Bohol Philippines",
  },
  {
    id: "carmen", name: "Carmen & the Chocolate Hills", island: "BOHOL", category: "Nature", mood: "Open hills & big skies",
    summary: "See Bohol’s distinctive limestone hills from the central highlands and explore the countryside at an unhurried pace.",
    officialUrl: "https://tourism.bohol.gov.ph/visitbohol-carmen/", mapQuery: "Chocolate Hills Carmen Bohol Philippines",
  },
  {
    id: "panglao", name: "Panglao", island: "BOHOL", category: "Coast & sea", mood: "Beach, boat & town",
    summary: "Mix a beach day with island-hopping options, the town’s historic church and watchtower, or a stop at the shell museum.",
    officialUrl: "https://tourism.bohol.gov.ph/visitbohol-panglao/", mapQuery: "Panglao Bohol Philippines",
  },
];

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ places }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
