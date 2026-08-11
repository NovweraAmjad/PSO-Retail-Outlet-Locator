import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Map from "./components/Map";
import FeedbackForm from "./components/FeedbackForm";
import { saveStations, getOfflineStations } from "./offlineData";

const translations = {
  en: {
    heroTitle: "Find Your Nearest PSO Station",
    heroSubtitle: "Real-time station search, navigation, and fuel card availability across Pakistan.",
    explore: "Explore Stations",
    home: "Home",
    map: "Map",
    findStation: "Find Station",
    locate: "Locate Me",
    searchPlaceholder: "Search by city or outlet name",
    alliancePlaceholder: "Search by Alliance / QSR name",
    filterAll: "All Stations",
    filterEnabled: "🟢 Card Accepted",
    filterDisabled: "🔴 Card Not Accepted",
    view: "View",
    hide: "Hide",
    stationFacilities: "Facilities / Services",
    shopStop: "Shop Stop",
    vibe: "VIBE",
    alliancesQsr: "Alliances / QSR",
    octaneR95: "Octane — R-95 facility",

    nearest: "Nearest Stations",
    status: "Status",
    address: "Address",
    distance: "Distance",
    cardEnabled: "🟢 Card Accepted",
    cardDisabled: "🔴 Card Not Accepted",
    loading: "Loading stations...",
    noResults: "No stations found for your search.",
    languageToggle: "اردو",
    stationCount: "stations found",
    cardAvailable: "🟢 Card Accepted",
    cardUnavailable: "🔴 Card Not Accepted",
    legendTitle: "Legend",
    markerYourLocation: "Your Location",
    heroMapLabel: "Live Fuel Station Map",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    locationOn: "Location ON",
    locationOff: "Location OFF",
    reportIssue: "Report an Issue",
    reportThisStation: "Report this station",
    feedbackHeading: "Report an Issue",
    feedbackIntro: "Submit a correction for station details or missing outlets.",
    feedbackClose: "Close",
    feedbackStationLabel: "Station Name",
    feedbackStationPlaceholder: "Enter station name or leave blank",
    feedbackIssueTypeLabel: "Issue Type",
    feedbackTypeWrong: "Wrong Details",
    feedbackTypeMissing: "Missing Outlet",
    feedbackMessageLabel: "Details",
    feedbackMessagePlaceholder: "Describe the problem or correction",
    feedbackContactLabel: "Your Email or Phone (optional)",
    feedbackContactPlaceholder: "Email or phone",
    feedbackSubmit: "Send Feedback",
    feedbackSubmitting: "Sending...",
    feedbackSuccess: "Thank you! Your feedback has been sent.",
    feedbackError: "Unable to send feedback. Please try again later.",
    feedbackValidation: "Please add a description of the issue.",
  },
  ur: {
    heroTitle: "اپنے قریب ترین پی ایس او اسٹیشن تلاش کریں",
    heroSubtitle: "پاکستان بھر میں ریئل ٹائم اسٹیشن تلاش، نیویگیشن اور فیول کارڈ دستیابی۔",
    explore: "اسٹیشن تلاش کریں",
    home: "ہوم",
    map: "نقشہ",
    findStation: "اسٹیشن تلاش کریں",
    locate: "میری جگہ",
    searchPlaceholder: "شہر یا آؤٹ لیٹ نام تلاش کریں",
    alliancePlaceholder: "الائنس / کیو ایس آر نام تلاش کریں",
    filterAll: "تمام اسٹیشن",
    filterEnabled: "🟢 Card Accepted",
    filterDisabled: "🔴 Card Not Accepted",
    view: "دیکھیں",
    hide: "چھپائیں",
    stationFacilities: "سہولیات / خدمات",
    shopStop: "شاپ اسٹاپ",
    vibe: "وائب",
    alliancesQsr: "الائنسز / کیو ایس آر",
    octaneR95: "اوکٹین — آر-95 سہولت",
    nearest: "قریب ترین اسٹیشن",
    status: "اسٹیٹس",
    address: "پتہ",
    distance: "فاصلہ",
    cardEnabled: "🟢 Card Accepted",
    cardUnavailable: "🔴 Card Not Accepted",
    loading: "اسٹیشن لوڈ ہو رہے ہیں...",
    noResults: "آپ کی تلاش کے لئے اسٹیشن نہیں ملا۔",
    languageToggle: "English",
    stationCount: "اسٹیشنز ملے",
    cardAvailable: "🟢 Card Accepted",
    cardDisabled: "🔴 Card Not Accepted",
    legendTitle: "لیجنڈ",
    markerYourLocation: "آپ کی جگہ",
    heroMapLabel: "لائیو اسٹیشن نقشہ",
    darkMode: "ڈارک موڈ",
    lightMode: "لائٹ موڈ",
    locationOn: "لوکیشن آن",
    locationOff: "لوکیشن آف",
    reportIssue: "مسئلہ رپورٹ کریں",
    reportThisStation: "اسٹیشن رپورٹ کریں",
    feedbackHeading: "مسئلہ رپورٹ کریں",
    feedbackIntro: "اسٹیشن کی تفصیلات یا غائب آؤٹ لیٹ کے لئے اصلاح جمع کریں۔",
    feedbackClose: "بند کریں",
    feedbackStationLabel: "اسٹیشن کا نام",
    feedbackStationPlaceholder: "اسٹیشن کا نام درج کریں یا خالی چھوڑ دیں",
    feedbackIssueTypeLabel: "مسئلے کی قسم",
    feedbackTypeWrong: "غلط تفصیلات",
    feedbackTypeMissing: "غائب آؤٹ لیٹ",
    feedbackMessageLabel: "تفصیلات",
    feedbackMessagePlaceholder: "مسئلہ یا اصلاح بیان کریں",
    feedbackContactLabel: "آپ کا ای میل یا فون (اختیاری)",
    feedbackContactPlaceholder: "ای میل یا فون",
    feedbackSubmit: "رائے بھیجیں",
    feedbackSubmitting: "بھیج رہا ہے...",
    feedbackSuccess: "شکریہ! آپ کی رائے بھیج دی گئی ہے۔",
    feedbackError: "رائے بھیجنے میں ناکامی۔ براہ کرم بعد میں دوبارہ کوشش کریں۔",
    feedbackValidation: "براہ کرم مسئلے کی تفصیل شامل کریں۔",
  },
};

function App() {
  const [stations, setStations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [filterMode, setFilterMode] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [outletTypeFilter, setOutletTypeFilter] = useState("");
  const [allianceFilter, setAllianceFilter] = useState("");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState(() => localStorage.getItem("pso-theme") || "light");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineStations, setOfflineStations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeoutRef = useRef(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStationId, setFeedbackStationId] = useState(null);
  const [feedbackStationName, setFeedbackStationName] = useState("");
  const [feedbackIssueType, setFeedbackIssueType] = useState("wrong_details");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState(null);
  const [feedbackStatusType, setFeedbackStatusType] = useState("success");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [openStationId, setOpenStationId] = useState(null);

  const navigate = useNavigate();
  const route = useLocation();
  const currentPath = route.pathname;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const shouldUseLocation = Boolean(locationEnabled && userLocation);
  const text = translations[language];
  const isRtl = language === "ur";
  const themeLabel = theme === "light" ? text.darkMode : text.lightMode;
  const navButtonStyle = theme === "dark"
    ? {
        marginInlineStart: "auto",
        minWidth: "118px",
        padding: "0.75rem 1.05rem",
        borderRadius: "999px",
        border: "1px solid rgba(148, 163, 184, 0.28)",
        backgroundColor: "rgba(15, 23, 42, 0.96)",
        color: "#dbeafe",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.2)",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }
    : {
        marginInlineStart: "auto",
        minWidth: "118px",
        padding: "0.75rem 1.05rem",
        borderRadius: "999px",
        border: "1px solid rgba(0, 87, 168, 0.18)",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        color: "#0057a8",
        boxShadow: "0 10px 24px rgba(0, 87, 168, 0.08)",
        flexShrink: 0,
        whiteSpace: "nowrap",
      };

  const PROVINCES = [
    "Azad Jammu & Kashmir",
    "Balochistan",
    "Gilgit-Baltistan",
    "Islamabad Capital Territory",
    "Khyber Pakhtunkhwa",
    "Punjab",
    "Sindh",
  ];

  const ZONES = ["Central", "North", "South"];

  const OUTLET_TYPES = [
    { value: "", label: "All Outlets" },
    { value: "new", label: "New Vision" },
    { value: "old", label: "Old Vision" },
    { value: "coco", label: "COCO Sites Only" },
  ];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pso-theme", theme);
  }, [theme]);

  const fetchStations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${apiUrl}/api/stations`;
      const response = await fetch(url);
      if (!response.ok) {
        let errMsg = "Failed to fetch stations";
        try {
          const body = await response.json();
          if (body && body.detail) errMsg = body.detail;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setStations(data);
      saveStations(data).catch(() => {});
    } catch (err) {
      const fallbackStations = await getOfflineStations().catch(() => []);
      if (fallbackStations.length > 0) {
        setStations(fallbackStations);
        setError("Unable to reach server; using offline station data.");
      } else {
        setStations([]);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentPath === "/map" && stations.length === 0) {
      fetchStations();
    }
  }, [currentPath, stations.length]);

  const reportFromStation = (station) => {
    // Redirect to feedback page with station prefilled
    navigate(`/feedback?station_id=${station.id}&station_name=${encodeURIComponent(station.name_of_outlets || '')}`);
  };

  const normalizeOptionText = (value) => (value || "").toString().trim().toLowerCase();

  const computeDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  };

  const divisionOptions = useMemo(() => {
    const set = new Set();
    stations.forEach((station) => {
      if (!station.pso_division) return;
      if (provinceFilter && normalizeOptionText(station.province) !== normalizeOptionText(provinceFilter)) return;
      if (zoneFilter && normalizeOptionText(station.zone) !== normalizeOptionText(zoneFilter)) return;
      set.add(station.pso_division);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [stations, provinceFilter, zoneFilter]);

  const districtOptions = useMemo(() => {
    const set = new Set();
    stations.forEach((station) => {
      if (!station.district) return;
      if (provinceFilter && normalizeOptionText(station.province) !== normalizeOptionText(provinceFilter)) return;
      if (zoneFilter && normalizeOptionText(station.zone) !== normalizeOptionText(zoneFilter)) return;
      if (divisionFilter && normalizeOptionText(station.pso_division) !== normalizeOptionText(divisionFilter)) return;
      set.add(station.district);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [stations, provinceFilter, zoneFilter, divisionFilter]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    stations.forEach((station) => {
      if (!station.city) return;
      if (provinceFilter && normalizeOptionText(station.province) !== normalizeOptionText(provinceFilter)) return;
      if (zoneFilter && normalizeOptionText(station.zone) !== normalizeOptionText(zoneFilter)) return;
      if (divisionFilter && normalizeOptionText(station.pso_division) !== normalizeOptionText(divisionFilter)) return;
      if (districtFilter && normalizeOptionText(station.district) !== normalizeOptionText(districtFilter)) return;
      set.add(station.city);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [stations, provinceFilter, zoneFilter, divisionFilter, districtFilter]);

  const allianceOptions = useMemo(() => {
    const set = new Set();
    stations.forEach((station) => {
      if (!station.alliances_qsr) return;
      if (provinceFilter && normalizeOptionText(station.province) !== normalizeOptionText(provinceFilter)) return;
      if (zoneFilter && normalizeOptionText(station.zone) !== normalizeOptionText(zoneFilter)) return;
      if (divisionFilter && normalizeOptionText(station.pso_division) !== normalizeOptionText(divisionFilter)) return;
      if (districtFilter && normalizeOptionText(station.district) !== normalizeOptionText(districtFilter)) return;
      if (cityFilter && normalizeOptionText(station.city) !== normalizeOptionText(cityFilter)) return;
      station.alliances_qsr
        .split(/[,/]|\band\b/gi)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((value) => set.add(value));
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [stations, provinceFilter, zoneFilter, divisionFilter, districtFilter, cityFilter]);

  const searchSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];

    const citySet = new Set();
    const districtSet = new Set();
    const outletSet = new Set();
    const allianceSet = new Set();

    stations.forEach((station) => {
      if (station.city?.toString().toLowerCase().includes(query)) citySet.add(station.city);
      if (station.district?.toString().toLowerCase().includes(query)) districtSet.add(station.district);
      if (station.name_of_outlets?.toString().toLowerCase().includes(query)) outletSet.add(station.name_of_outlets);
      if (station.alliances_qsr?.toString().toLowerCase().includes(query)) allianceSet.add(station.alliances_qsr);
    });

    const suggestions = [
      ...[...citySet].slice(0, 4).map((value) => ({ type: "City", value })),
      ...[...districtSet].slice(0, 4).map((value) => ({ type: "District", value })),
      ...[...outletSet].slice(0, 4).map((value) => ({ type: "Outlet", value })),
      ...[...allianceSet].slice(0, 4).map((value) => ({ type: "Alliance / QSR", value })),
    ];

    return suggestions.slice(0, 10);
  }, [stations, searchText]);

  const handleSuggestionSelect = (value) => {
    setSearchText(value);
    setShowSuggestions(false);
    if (currentPath !== "/map") {
      navigate("/map");
    }
  };

  const handleSearch = () => {
    if (currentPath !== "/map") navigate("/map");
    setShowSuggestions(false);
    fetchStations();
  };

  const filterByOutletType = (station) => {
    if (!outletTypeFilter) return true;
    const typeValue = normalizeOptionText(station.type);
    const cocoValue = normalizeOptionText(station.coco_site);
    if (outletTypeFilter === "new") {
      return typeValue === "nv" || typeValue.includes("new vision") || typeValue.includes("new");
    }
    if (outletTypeFilter === "old") {
      return typeValue === "ov" || typeValue.includes("old vision") || typeValue.includes("old");
    }
    if (outletTypeFilter === "coco") {
      return (
        cocoValue === "y" ||
        cocoValue === "yes" ||
        cocoValue === "coco" ||
        cocoValue === "coco site" ||
        typeValue.includes("coco")
      );
    }
    return true;
  };

  const filterByAlliance = (station) => {
    if (!allianceFilter) return true;
    const allianceValue = normalizeOptionText(station.alliances_qsr);
    const searchValue = normalizeOptionText(allianceFilter);
    return allianceValue.includes(searchValue);
  };

  const filteredStations = useMemo(() => {
    const q = (searchText || "").trim().toLowerCase();

    // Apply basic filters first (province/zone/division/district/city/outlet type)
    let candidates = stations.filter((station) => {
      if (filterMode === "enabled" && station.pso_cards_enabled?.toString().toUpperCase() !== "Y") return false;
      if (filterMode === "disabled" && station.pso_cards_enabled?.toString().toUpperCase() === "Y") return false;
      if (provinceFilter && normalizeOptionText(station.province) !== normalizeOptionText(provinceFilter)) return false;
      if (zoneFilter && normalizeOptionText(station.zone) !== normalizeOptionText(zoneFilter)) return false;
      if (divisionFilter && normalizeOptionText(station.pso_division) !== normalizeOptionText(divisionFilter)) return false;
      if (districtFilter && normalizeOptionText(station.district) !== normalizeOptionText(districtFilter)) return false;
      if (cityFilter && normalizeOptionText(station.city) !== normalizeOptionText(cityFilter)) return false;
      if (!filterByAlliance(station)) return false;
      if (!filterByOutletType(station)) return false;
      return true;
    });

    // If no search query, return candidates and only attach distance when location is actively enabled
    if (!q) {
      return candidates.map((station) => {
        if (shouldUseLocation && station.latitude != null && station.longitude != null) {
          return { ...station, distance_km: computeDistanceKm(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude).toFixed(2) };
        }
        return { ...station, distance_km: null };
      });
    }

    // Scoring function for smart search
    const normalize = (s) => (s || "").toString().toLowerCase();
    const qNorm = q.replace(/[-,\/]+/g, " ").replace(/\s+/g, " ").trim();
    const qTokens = qNorm.split(" ").filter(Boolean);

    const scored = candidates
      .map((station) => {
        let score = 0;
        const fields = [
          station.name_of_outlets,
          station.location,
          station.city,
          station.district,
          station.province,
          station.alliances_qsr,
          station.type,
        ]
          .filter(Boolean)
          .map((s) => normalize(s));

        const combined = fields.join(" ");

        // Exact full-text match
        if (combined === qNorm) score += 200;

        // Exact field match boosts
        if (fields.some((f) => f === qNorm)) score += 150;

        // Whole-word contains
        if (fields.some((f) => (` ${f} `).includes(` ${qNorm} `))) score += 100;

        // Token matches: reward number of tokens matched
        let tokenMatches = 0;
        for (const t of qTokens) {
          if (combined.includes(t)) tokenMatches += 1;
        }
        score += tokenMatches * 20;

        // Sector/short forms: allow matching F7 <-> F-7
        const simplifiedCombined = combined.replace(/[-\s]+/g, "");
        const simplifiedQ = q.replace(/[-\s]+/g, "");
        if (simplifiedCombined.includes(simplifiedQ)) score += 40;

        // Give a small relevance boost if the city or district matches specifically
        if (station.city && normalize(station.city) === q) score += 50;
        if (station.district && normalize(station.district) === q) score += 25;

        // Compute distance penalty only when location is actively enabled (closer is better)
        let distance_km = null;
        if (shouldUseLocation && station.latitude != null && station.longitude != null) {
          distance_km = computeDistanceKm(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude);
        }

        return { ...station, _score: score, distance_km: distance_km != null ? distance_km.toFixed(2) : null };
      })
      .filter((s) => s._score > 0)
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        const da = a.distance_km != null ? Number(a.distance_km) : Number.MAX_VALUE;
        const db = b.distance_km != null ? Number(b.distance_km) : Number.MAX_VALUE;
        return da - db;
      });

    // If no scored results, only fall back to nearest stations when location is actively enabled
    if (scored.length === 0) {
      if (shouldUseLocation) {
        return candidates
          .filter((s) => s.latitude != null && s.longitude != null)
          .map((station) => ({ ...station, distance_km: computeDistanceKm(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude).toFixed(2) }))
          .sort((a, b) => (Number(a.distance_km) || Number.MAX_VALUE) - (Number(b.distance_km) || Number.MAX_VALUE))
          .slice(0, 50);
      }
      // location is off or unavailable -> return empty list to avoid unrelated results
      return [];
    }

    return scored;
  }, [stations, searchText, filterMode, provinceFilter, zoneFilter, divisionFilter, districtFilter, cityFilter, allianceFilter, outletTypeFilter, shouldUseLocation, userLocation]);

  const nearestStations = useMemo(() => {
    if (!shouldUseLocation) return [];
    return [...filteredStations]
      .filter((station) => station.latitude != null && station.longitude != null)
      .sort((a, b) => (Number(a.distance_km) || Number.MAX_VALUE) - (Number(b.distance_km) || Number.MAX_VALUE))
      .slice(0, 5);
  }, [filteredStations, shouldUseLocation]);

  const handleExploreStations = () => {
    console.log("Exploring stations...");
    navigate("/map");
  };

  const toggleStationView = (stationId) => {
    setOpenStationId((current) => (current === stationId ? null : stationId));
  };

  const formatFacilityValue = (value) => {
    if (value == null || value === "") return "Not listed";
    const normalized = value.toString().trim().toUpperCase();
    if (normalized === "Y") return "Available";
    if (normalized === "N") return "Not Available";
    return value;
  };

  const formatStationAddress = (station) => {
    if (station.location && station.location.toString().trim()) return station.location.toString().trim();
    return [station.city, station.district].filter(Boolean).join(", ") || "Address not listed";
  };

  const printCriteria = useMemo(() => {
    const criteria = [];

    if (searchText.trim()) {
      criteria.push(`Search: ${searchText.trim()}`);
    } else {
      criteria.push("Search: All stations");
    }

    criteria.push(`Filter mode: ${filterMode === "all" ? "All stations" : filterMode === "enabled" ? "Card Accepted" : "Card Not Accepted"}`);

    if (provinceFilter) criteria.push(`Province: ${provinceFilter}`);
    if (zoneFilter) criteria.push(`Zone: ${zoneFilter}`);
    if (divisionFilter) criteria.push(`Division: ${divisionFilter}`);
    if (districtFilter) criteria.push(`District: ${districtFilter}`);
    if (cityFilter) criteria.push(`City: ${cityFilter}`);
    if (allianceFilter) criteria.push(`Alliance / QSR: ${allianceFilter}`);
    if (outletTypeFilter) criteria.push(`Outlet Type: ${outletTypeFilter}`);

    if (locationEnabled && userLocation) {
      criteria.push(`My Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    } else if (locationEnabled) {
      criteria.push("My Location: enabled");
    } else {
      criteria.push("My Location: off");
    }

    return criteria;
  }, [allianceFilter, cityFilter, divisionFilter, districtFilter, filterMode, locationEnabled, outletTypeFilter, provinceFilter, searchText, userLocation, zoneFilter]);

  const printStations = filteredStations;

  const handlePrint = () => {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => window.print(), 120);
    });
  };

  const openFeedback = (station = null) => {
    setFeedbackOpen(true);
    setFeedbackStatusMessage(null);
    setFeedbackStatusType("success");
    if (station) {
      setFeedbackStationId(station.id);
      setFeedbackStationName(station.name_of_outlets || "");
    } else {
      setFeedbackStationId(null);
      setFeedbackStationName("");
    }
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackStationId(null);
    setFeedbackStationName("");
    setFeedbackIssueType("wrong_details");
    setFeedbackMessage("");
    setFeedbackContact("");
    setFeedbackStatusMessage(null);
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      setFeedbackStatusType("error");
      setFeedbackStatusMessage(text.feedbackValidation);
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackStatusMessage(null);

    try {
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: feedbackStationId,
          station_name: feedbackStationName?.trim() || null,
          issue_type: feedbackIssueType,
          message: feedbackMessage.trim(),
          contact: feedbackContact.trim() || null,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to submit feedback";
        try {
          const body = await response.json();
          if (body && body.detail) errMsg = body.detail;
        } catch {}
        throw new Error(errMsg);
      }

      setFeedbackStatusType("success");
      setFeedbackStatusMessage(text.feedbackSuccess);
      setFeedbackMessage("");
      setFeedbackContact("");
    } catch (err) {
      setFeedbackStatusType("error");
      setFeedbackStatusMessage(text.feedbackError);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      return setError("Geolocation is not supported by your browser.");
    }
    // Request location and mark location tracking as enabled
    setLocationEnabled(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setError(null);
      },
      () => {
        setError("Unable to retrieve your current location.");
        setLocationEnabled(false);
      },
    );
  };

  const handleToggleLocation = () => {
    if (locationEnabled) {
      // Turn off location tracking and hide user marker
      setLocationEnabled(false);
      setUserLocation(null);
      setError(null);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    // Turn on and request permission
    setLocationEnabled(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(newLocation);
        setError(null);
      },
      () => {
        setError("Unable to retrieve your current location.");
        setLocationEnabled(false);
        setUserLocation(null);
      },
    );
  };

  useEffect(() => {
    getOfflineStations()
      .then((cachedStations) => {
        if (cachedStations.length > 0) {
          setOfflineStations(cachedStations);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleLanguage = () => setLanguage((prev) => (prev === "en" ? "ur" : "en"));
  const handleToggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const loadedStationCount = stations.length;

  return (
    <div className={`app-shell ${isRtl ? "rtl" : "ltr"}`}>
      <header className="topbar">
        <div className="brand-row">
          <img className="nav-logo" src={`${apiUrl}/static/psologo.png`} alt="PSO Logo" />
          <span className="brand-name">PSO Station Locator</span>
        </div>
        <nav className="nav-links">
          <button onClick={() => navigate("/")}>{text.home}</button>
          <button onClick={handleExploreStations}>{text.findStation}</button>
          <button onClick={() => navigate("/feedback")}>{text.reportIssue}</button>
          <button onClick={handlePrint}>Print</button>
          <button className="theme-toggle" onClick={handleToggleTheme}>{themeLabel}</button>
          <button className="lang-toggle" onClick={handleToggleLanguage}>{text.languageToggle}</button>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={
          <main className="landing-page">
          <section className="hero-panel">
            <div className="hero-brand-visual" aria-hidden="true">
              <div className="hero-brand-orbit"></div>
              <div className="hero-brand-lines"></div>
              <div className="hero-brand-energy hero-brand-energy-primary"></div>
              <div className="hero-brand-energy hero-brand-energy-secondary"></div>
              <img className="hero-brand-logo" src={`${apiUrl}/static/psologo.png`} alt="" />
            </div>
            <div className="hero-copy">
              <span className="eyebrow">PSO Energy Network</span>
              <h1>{text.heroTitle}</h1>
              <p>{text.heroSubtitle}</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={handleExploreStations}>{text.explore}</button>
                <button className="secondary-button" onClick={() => navigate("/map")}>{text.map}</button>
                <button className="secondary-button" onClick={handleUseLocation}>{text.locate}</button>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-map-card">
                <Map stations={[]} text={text} language={language} compact />
                <div className="hero-map-label">{text.heroMapLabel}</div>
                <div className="hero-map-points">
                  <span className="hero-point point-enabled"></span>
                  <span className="hero-point point-normal"></span>
                  <span className="hero-point point-disabled"></span>
                </div>
              </div>
            </div>
          </section>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Smart Search</h3>
              <p>Search by city or outlet name and find the closest PSO station instantly.</p>
            </article>
            <article className="feature-card">
              <h3>Fuel Card Status</h3>
              <p>See which stations support PSO fuel cards and which ones are currently unavailable.</p>
            </article>
            <article className="feature-card">
              <h3>Real-time Location</h3>
              <p>Use your current location to discover stations nearby and navigate with ease.</p>
            </article>
          </div>
        </main>
        } />
        <Route path="/map" element={
          <main className="map-page">
            <section className="map-header">
            <div>
              <h2>{text.heroTitle}</h2>
              <p>{text.heroSubtitle}</p>
            </div>
            <div className="header-actions">
              <button className={`location-toggle ${locationEnabled ? "active" : ""}`} onClick={handleToggleLocation}>
                {locationEnabled ? text.locationOn : text.locationOff}
              </button>
              <button className="secondary-button report-toggle" type="button" onClick={() => navigate('/feedback')}>
                {text.reportIssue}
              </button>
            </div>
          </section>

          <section className="search-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder={text.searchPlaceholder}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  blurTimeoutRef.current = window.setTimeout(() => setShowSuggestions(false), 120);
                }}
              />
              <button className="primary-button" onClick={handleSearch}>{text.findStation}</button>
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestion-list">
                  {searchSuggestions.map((item) => (
                    <button
                      key={`${item.type}-${item.value}`}
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={() => handleSuggestionSelect(item.value)}
                    >
                      <span className="suggestion-type">{item.type}</span>
                      <span>{item.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="filter-group">
              {["all", "enabled", "disabled"].map((mode) => (
                <button
                  key={mode}
                  className={`filter-pill ${filterMode === mode ? "active" : ""}`}
                  onClick={() => setFilterMode(mode)}
                >
                  {mode === "all" ? text.filterAll : mode === "enabled" ? text.filterEnabled : text.filterDisabled}
                </button>
              ))}
            </div>
          </section>

          {feedbackOpen && (
            <section className="feedback-panel">
              <div className="feedback-panel-header">
                <div>
                  <h3>{text.feedbackHeading}</h3>
                  <p>{text.feedbackIntro}</p>
                </div>
                <button className="text-button" type="button" onClick={closeFeedback}>{text.feedbackClose}</button>
              </div>

              <div className="feedback-fields">
                <div className="feedback-row">
                  <label>{text.feedbackStationLabel}</label>
                  <input
                    type="text"
                    value={feedbackStationName}
                    onChange={(e) => setFeedbackStationName(e.target.value)}
                    placeholder={text.feedbackStationPlaceholder}
                  />
                </div>

                <div className="feedback-row">
                  <label>{text.feedbackIssueTypeLabel}</label>
                  <select value={feedbackIssueType} onChange={(e) => setFeedbackIssueType(e.target.value)}>
                    <option value="wrong_details">{text.feedbackTypeWrong}</option>
                    <option value="missing_outlet">{text.feedbackTypeMissing}</option>
                  </select>
                </div>

                <div className="feedback-row">
                  <label>{text.feedbackMessageLabel}</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder={text.feedbackMessagePlaceholder}
                  />
                </div>

                <div className="feedback-row">
                  <label>{text.feedbackContactLabel}</label>
                  <input
                    type="text"
                    value={feedbackContact}
                    onChange={(e) => setFeedbackContact(e.target.value)}
                    placeholder={text.feedbackContactPlaceholder}
                  />
                </div>

                {feedbackStatusMessage && (
                  <div className={`feedback-status ${feedbackStatusType}`}>
                    {feedbackStatusMessage}
                  </div>
                )}

                <div className="feedback-actions">
                  <button className="primary-button" type="button" onClick={submitFeedback} disabled={isSubmittingFeedback}>
                    {isSubmittingFeedback ? text.feedbackSubmitting : text.feedbackSubmit}
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="filter-panel">
            <div className="filter-row">
              <div className="filter-field">
                <label>Province</label>
                <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)}>
                  <option value="">All Provinces</option>
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Region / Zone</label>
                <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                  <option value="">All Zones</option>
                  {ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Division</label>
                <input
                  list="division-options"
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  placeholder="All Divisions"
                />
                <datalist id="division-options">
                  {divisionOptions.map((division) => (
                    <option key={division} value={division} />
                  ))}
                </datalist>
              </div>

              <div className="filter-field">
                <label>District</label>
                <input
                  list="district-options"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  placeholder="All Districts"
                />
                <datalist id="district-options">
                  {districtOptions.map((district) => (
                    <option key={district} value={district} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-field">
                <label>City / Town</label>
                <input
                  list="city-options"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="All Cities"
                />
                <datalist id="city-options">
                  {cityOptions.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>

              <div className="filter-field">
                <label>{text.alliancesQsr}</label>
                <input
                  list="alliance-options"
                  value={allianceFilter}
                  onChange={(e) => setAllianceFilter(e.target.value)}
                  placeholder={text.alliancePlaceholder}
                />
                <datalist id="alliance-options">
                  {allianceOptions.map((alliance) => (
                    <option key={alliance} value={alliance} />
                  ))}
                </datalist>
              </div>

              <div className="filter-field">
                <label>Outlet Type</label>
                <select value={outletTypeFilter} onChange={(e) => setOutletTypeFilter(e.target.value)}>
                  {OUTLET_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-actions">
                <button className="secondary-button" type="button" onClick={() => {
                  setProvinceFilter("");
                  setZoneFilter("");
                  setDivisionFilter("");
                  setDistrictFilter("");
                  setCityFilter("");
                  setAllianceFilter("");
                  setOutletTypeFilter("");
                }}>
                  Reset Filters
                </button>
              </div>
            </div>
          </section>

          <div className="content-grid">
            <div className="map-panel">
              <Map stations={filteredStations} userLocation={userLocation} text={text} language={language} searchText={searchText} />
              <div className="legend-card">
                <h4>{text.legendTitle}</h4>
                <div className="legend-row"><span className="legend-dot enabled"></span><span>{text.cardEnabled}</span></div>
                <div className="legend-row"><span className="legend-dot normal"></span><span>{text.home}</span></div>
                <div className="legend-row"><span className="legend-dot disabled"></span><span>{text.cardDisabled}</span></div>
              </div>
            </div>

            <aside className="station-panel">
              <div className="panel-header">
                <div>
                  <h3>{filteredStations.length} / {loadedStationCount} {text.stationCount}</h3>
                  <p>{searchText ? `${text.findStation} • ${searchText}` : null}</p>
                </div>
                <div className="panel-header-actions">
                    {isLoading && <span className="loading-chip">{text.loading}</span>}
                  </div>
              </div>
              {error && <div className="error-box">{error}</div>}
              {userLocation && nearestStations.length > 0 && (
                <div className="nearest-block">
                  <h3>{text.nearest}</h3>
                  {nearestStations.map((station) => (
                    <div key={`nearest-${station.id}`} className="station-card highlight-card">
                      <strong>{station.name_of_outlets}</strong>
                      <div className="station-address station-address--compact">
                        <span className="address-pin">📍</span>
                        <span>{formatStationAddress(station)}</span>
                      </div>
                      <div>{station.city}, {station.district}</div>
                      <div>{text.status}: {station.pso_cards_enabled?.toUpperCase() === "Y" ? text.cardEnabled : text.cardDisabled}</div>
                      <div>{text.distance}: {station.distance_km} km</div>
                      <button className="secondary-button station-view-button" type="button" onClick={() => toggleStationView(station.id)}>
                        {openStationId === station.id ? text.hide : text.view}
                      </button>
                      {openStationId === station.id && (
                        <div className="station-view-panel">
                          <h4>{text.stationFacilities}</h4>
                          <div className="station-view-grid">
                            <div className="station-view-item">
                              <span>{text.shopStop}</span>
                              <strong>{formatFacilityValue(station.shop_stop)}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.vibe}</span>
                              <strong>{formatFacilityValue(station.vibe)}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.alliancesQsr}</span>
                              <strong>{station.alliances_qsr || "Not listed"}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.octaneR95}</span>
                              <strong>{formatFacilityValue(station.octane_status || station.r95_facility)}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="station-list">
                {filteredStations.length === 0 ? (
                  <div className="empty-state">{text.noResults}</div>
                ) : (
                  filteredStations.map((station) => (
                    <div key={station.id} className="station-card">
                      <div className="station-card-header">
                        <strong>{station.name_of_outlets}</strong>
                        <div className="station-card-actions">
                          <span className={`status-chip ${station.pso_cards_enabled?.toString().toUpperCase() === "Y" ? "status-enabled" : "status-disabled"}`}>
                            {station.pso_cards_enabled?.toString().toUpperCase() === "Y" ? text.cardEnabled : text.cardDisabled}
                          </span>
                          <button className="secondary-button station-view-button" type="button" onClick={() => toggleStationView(station.id)}>
                            {openStationId === station.id ? text.hide : text.view}
                          </button>
                        </div>
                      </div>
                      <div className="station-address">
                        <span className="address-pin">📍</span>
                        <span>{formatStationAddress(station)}</span>
                      </div>
                      <div className="station-meta">
                        <span className="station-city">{station.city || ''}</span>
                        {station.distance_km != null && <span className="station-distance">{text.distance}: {station.distance_km} km</span>}
                        <button className="secondary-button nav-button" type="button" style={navButtonStyle} onClick={() => {
                          if (station.latitude != null && station.longitude != null) {
                            const url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
                            window.open(url, '_blank');
                          }
                        }}>Navigate</button>
                      </div>
                      {openStationId === station.id && (
                        <div className="station-view-panel">
                          <h4>{text.stationFacilities}</h4>
                          <div className="station-view-grid">
                            <div className="station-view-item">
                              <span>{text.shopStop}</span>
                              <strong>{formatFacilityValue(station.shop_stop)}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.vibe}</span>
                              <strong>{formatFacilityValue(station.vibe)}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.alliancesQsr}</span>
                              <strong>{station.alliances_qsr || "Not listed"}</strong>
                            </div>
                            <div className="station-view-item">
                              <span>{text.octaneR95}</span>
                              <strong>{formatFacilityValue(station.octane_status || station.r95_facility)}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </main>
        } />
        <Route path="/feedback" element={<FeedbackForm apiUrl={apiUrl} text={text} />} />
        <Route path="*" element={<main className="landing-page">
          <section className="hero-panel">
            <div className="hero-copy">
              <span className="eyebrow">PSO Energy Network</span>
              <h1>{text.heroTitle}</h1>
              <p>{text.heroSubtitle}</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={handleExploreStations}>{text.explore}</button>
                <button className="secondary-button" onClick={() => navigate("/map")}>{text.map}</button>
                <button className="secondary-button" onClick={handleUseLocation}>{text.locate}</button>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-map-card">
                <Map stations={[]} text={text} language={language} compact />
                <div className="hero-map-label">{text.heroMapLabel}</div>
                <div className="hero-map-points">
                  <span className="hero-point point-enabled"></span>
                  <span className="hero-point point-normal"></span>
                  <span className="hero-point point-disabled"></span>
                </div>
              </div>
            </div>
          </section>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Smart Search</h3>
              <p>Search by city or outlet name and find the closest PSO station instantly.</p>
            </article>
            <article className="feature-card">
              <h3>Fuel Card Status</h3>
              <p>See which stations support PSO fuel cards and which ones are currently unavailable.</p>
            </article>
            <article className="feature-card">
              <h3>Real-time Location</h3>
              <p>Use your current location to discover stations nearby and navigate with ease.</p>
            </article>
          </div>
        </main>} />
      </Routes>

      {isLoading && currentPath === "/map" && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>{text.loading}</p>
        </div>
      )}

      {/* Print report container - shown only during printing via CSS */}
      <div className="print-report" aria-hidden="true">
        <div className="print-header">
          <div className="print-brand">
            <div className="print-brand-mark">PSO</div>
            <div>
              <h1>PSO Station Report</h1>
              <p>Generated from the currently displayed results</p>
            </div>
          </div>
          <div className="print-meta">
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="print-summary">
          <div className="print-summary-item"><strong>Total stations:</strong> {printStations.length}</div>
          <div className="print-summary-item"><strong>Shown results:</strong> {printStations.length === 0 ? "No stations found" : `${printStations.length} station${printStations.length === 1 ? "" : "s"}`}</div>
        </div>

        <div className="print-filters">
          <strong>Criteria:</strong>
          {printCriteria.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>

        {printStations.length === 0 ? (
          <div className="print-empty-state">No stations match the current search or filters.</div>
        ) : (
          <div className="print-station-list">
            {printStations.map((station, idx) => (
              <article key={`print-${station.id}`} className="print-station-card">
                <div className="print-station-card-header">
                  <div>
                    <div className="print-station-number">{idx + 1}</div>
                    <h3>{station.name_of_outlets || "Unnamed Outlet"}</h3>
                  </div>
                  <span className={`print-status-badge ${station.pso_cards_enabled?.toString().toUpperCase() === "Y" ? "print-status-enabled" : "print-status-disabled"}`}>
                    {station.pso_cards_enabled?.toString().toUpperCase() === "Y" ? text.cardEnabled : text.cardDisabled}
                  </span>
                </div>

                <div className="print-station-grid">
                  <div className="print-station-item">
                    <span>Address</span>
                    <strong>{formatStationAddress(station)}</strong>
                  </div>
                  <div className="print-station-item">
                    <span>City / District</span>
                    <strong>{[station.city, station.district].filter(Boolean).join(" / ") || "Not listed"}</strong>
                  </div>
                  <div className="print-station-item">
                    <span>Province / Zone</span>
                    <strong>{[station.province, station.zone].filter(Boolean).join(" / ") || "Not listed"}</strong>
                  </div>
                  <div className="print-station-item">
                    <span>Division</span>
                    <strong>{station.pso_division || "Not listed"}</strong>
                  </div>
                </div>

                <div className="print-station-footer">
                  <span><strong>Shop Stop:</strong> {formatFacilityValue(station.shop_stop)}</span>
                  <span><strong>VIBE:</strong> {formatFacilityValue(station.vibe)}</span>
                  <span><strong>Alliances / QSR:</strong> {station.alliances_qsr || "Not listed"}</span>
                  <span><strong>R-95:</strong> {formatFacilityValue(station.octane_status || station.r95_facility)}</span>
                  {station.distance_km != null && <span><strong>Distance:</strong> {station.distance_km} km</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
