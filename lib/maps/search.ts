import {
  findPlaceById,
  getParentBuilding,
  PLACES,
  type MyeongjiPlace,
  type PlaceKind,
} from './places';

export type MapSearchRoutingType = 'DIRECT_TO_MAP_BOTTOMSHEET' | 'SHOW_LIST_OR_AUTOCOMPLETE';

export type MapSearchTargetScreen = '05-1-2' | '05-4-2' | '02-4' | '05-2';

export type MapSearchPlaceType = 'BUILDING' | 'FACILITY' | 'EXTERNAL_LOCATION';

export type MapSearchCoordinates = {
  latitude: number;
  longitude: number;
};

export type MapSearchRoutingTarget = {
  targetScreen: MapSearchTargetScreen;
  placeId: string;
  placeName: string;
  placeType: MapSearchPlaceType;
  coordinates: MapSearchCoordinates;
  buildingId?: string;
  buildingName?: string;
};

export type MapSearchMetadata = {
  query: string;
  normalizedQuery: string;
  exactMatch: boolean;
  routingType: MapSearchRoutingType;
  routingTarget: MapSearchRoutingTarget | null;
};

export type MapSearchResult = MyeongjiPlace & {
  isBuilding: boolean;
  placeType: MapSearchPlaceType;
  targetScreen: MapSearchTargetScreen;
  parentBuildingInfo?: {
    buildingId: string;
    buildingName: string;
  };
};

export type MapSearchResponse = {
  searchMetadata: MapSearchMetadata;
  searchResults: MapSearchResult[];
};

export type RawMapSearchRoutingTarget = {
  target_screen?: MapSearchTargetScreen | null;
  place_id?: string | null;
  building_id?: string | null;
  official_name?: string | null;
  place_name?: string | null;
  type?: MapSearchPlaceType | null;
  coordinates?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

export type RawMapSearchResult = {
  place_id: string;
  place_name?: string | null;
  is_building?: boolean | null;
  type?: MapSearchPlaceType | null;
  target_screen?: MapSearchTargetScreen | null;
  parent_building_info?: {
    building_id?: string | null;
    building_name?: string | null;
  } | null;
};

export type RawMapSearchResponse = {
  search_metadata: {
    query: string;
    exact_match: boolean;
    routing_type: MapSearchRoutingType;
    routing_target?: RawMapSearchRoutingTarget | null;
  };
  search_results: RawMapSearchResult[];
};

type SearchCandidate = {
  place: MyeongjiPlace;
  score: number;
  exactMatch: boolean;
};

const BUILDING_SYNONYM_PLACE_IDS: Record<string, string> = {
  문대: 'main-building',
  문과대: 'main-building',
  인문대: 'main-building',
  구본관: 'main-building',
  본관: 'main-building',
  학관: 'student-center',
  학회: 'student-center',
  방목: 'library',
  도서관: 'library',
  도관: 'library',
  학정: 'library',
  행정관: 'administration',
  대학본부: 'administration',
  경상관: 'international-building',
  국제관: 'international-building',
  미래관: 'future-building',
  생활관: 'dormitory',
  기숙사: 'dormitory',
};

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function getSearchTokens(place: MyeongjiPlace) {
  return [
    place.name,
    place.code,
    place.categoryLabel,
    place.location,
    ...place.aliases,
    ...place.keywords,
  ]
    .filter(Boolean)
    .map((value) => normalizeKeyword(value!));
}

function getExactTokens(place: MyeongjiPlace) {
  return [place.name, place.code, ...place.aliases]
    .filter(Boolean)
    .map((value) => normalizeKeyword(value!));
}

function getPlaceType(place: MyeongjiPlace): MapSearchPlaceType {
  if (place.kind === 'building') return 'BUILDING';
  if (place.kind === 'external') return 'EXTERNAL_LOCATION';
  return 'FACILITY';
}

function getTargetScreen(place: MyeongjiPlace): MapSearchTargetScreen {
  if (place.kind === 'building') return '05-1-2';
  if (place.kind === 'facility') return '02-4';
  return '05-2';
}

function toMapSearchResult(place: MyeongjiPlace): MapSearchResult {
  const parentBuilding = getParentBuilding(place);
  const placeType = getPlaceType(place);

  return {
    ...place,
    isBuilding: placeType === 'BUILDING',
    placeType,
    targetScreen: getTargetScreen(place),
    parentBuildingInfo:
      parentBuilding && parentBuilding.id !== place.id
        ? {
            buildingId: parentBuilding.id,
            buildingName: parentBuilding.name,
          }
        : undefined,
  };
}

function toRoutingTarget(place: MyeongjiPlace): MapSearchRoutingTarget {
  const parentBuilding = getParentBuilding(place);

  return {
    targetScreen: getTargetScreen(place),
    placeId: place.id,
    placeName: place.name,
    placeType: getPlaceType(place),
    coordinates: {
      latitude: place.latitude,
      longitude: place.longitude,
    },
    buildingId: parentBuilding?.id,
    buildingName: parentBuilding?.name,
  };
}

function scorePlace(place: MyeongjiPlace, normalizedQuery: string): SearchCandidate | null {
  const exactMatch = getExactTokens(place).includes(normalizedQuery);
  const tokens = getSearchTokens(place);
  const containsMatch = tokens.some((token) => token.includes(normalizedQuery));

  if (!exactMatch && !containsMatch) return null;

  const typeWeight: Record<PlaceKind, number> = {
    building: 30,
    facility: 20,
    external: 10,
  };

  return {
    place,
    exactMatch,
    score: (exactMatch ? 100 : 0) + typeWeight[place.kind],
  };
}

function buildResponse(query: string, candidates: SearchCandidate[]): MapSearchResponse {
  const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
  const results = sortedCandidates.map((candidate) => toMapSearchResult(candidate.place));
  const exactCandidates = sortedCandidates.filter((candidate) => candidate.exactMatch);
  const exactBuildingCandidates = exactCandidates.filter(
    (candidate) => getPlaceType(candidate.place) === 'BUILDING'
  );
  const directCandidate =
    exactCandidates.length === 1 && exactBuildingCandidates.length === 1
      ? exactBuildingCandidates[0]
      : null;

  return {
    searchMetadata: {
      query,
      normalizedQuery: normalizeKeyword(query),
      exactMatch: !!directCandidate,
      routingType: directCandidate ? 'DIRECT_TO_MAP_BOTTOMSHEET' : 'SHOW_LIST_OR_AUTOCOMPLETE',
      routingTarget: directCandidate ? toRoutingTarget(directCandidate.place) : null,
    },
    searchResults: directCandidate ? [] : results,
  };
}

function adaptRoutingTarget(rawTarget?: RawMapSearchRoutingTarget | null) {
  if (!rawTarget) return null;

  const place = findPlaceById(rawTarget.place_id ?? rawTarget.building_id);
  if (place) return toRoutingTarget(place);

  const routePlaceId = rawTarget.place_id ?? rawTarget.building_id;
  if (
    !routePlaceId ||
    !rawTarget.target_screen ||
    rawTarget.coordinates?.latitude == null ||
    rawTarget.coordinates.longitude == null
  ) {
    return null;
  }

  return {
    targetScreen: rawTarget.target_screen,
    placeId: routePlaceId,
    placeName: rawTarget.place_name ?? rawTarget.official_name ?? routePlaceId,
    placeType: rawTarget.type ?? 'BUILDING',
    coordinates: {
      latitude: rawTarget.coordinates.latitude,
      longitude: rawTarget.coordinates.longitude,
    },
    buildingId: rawTarget.building_id ?? undefined,
    buildingName: rawTarget.official_name ?? rawTarget.place_name ?? undefined,
  } satisfies MapSearchRoutingTarget;
}

function adaptSearchResult(rawResult: RawMapSearchResult): MapSearchResult | null {
  const place = findPlaceById(rawResult.place_id);
  if (place) return toMapSearchResult(place);

  return null;
}

export function adaptMapSearchResponse(rawResponse: RawMapSearchResponse): MapSearchResponse {
  const routingTarget = adaptRoutingTarget(rawResponse.search_metadata.routing_target);

  return {
    searchMetadata: {
      query: rawResponse.search_metadata.query,
      normalizedQuery: normalizeKeyword(rawResponse.search_metadata.query),
      exactMatch: rawResponse.search_metadata.exact_match,
      routingType: rawResponse.search_metadata.routing_type,
      routingTarget,
    },
    searchResults: rawResponse.search_results
      .map(adaptSearchResult)
      .filter((result): result is MapSearchResult => result !== null),
  };
}

export function searchMyeongjiPlaces(query: string): MapSearchResponse {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeKeyword(trimmedQuery);

  if (!normalizedQuery) {
    return buildResponse(trimmedQuery, []);
  }

  const synonymPlaceId = BUILDING_SYNONYM_PLACE_IDS[normalizedQuery];
  const synonymPlace = findPlaceById(synonymPlaceId);

  if (synonymPlace) {
    return buildResponse(trimmedQuery, [
      {
        place: synonymPlace,
        exactMatch: true,
        score: 130,
      },
    ]);
  }

  return buildResponse(
    trimmedQuery,
    PLACES.map((place) => scorePlace(place, normalizedQuery)).filter(
      (candidate): candidate is SearchCandidate => candidate !== null
    )
  );
}
