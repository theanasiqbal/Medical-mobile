// context/language-context.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = (await AsyncStorage.getItem(
        "language",
      )) as Language | null;
      if (stored && (stored === "en" || stored === "hi")) {
        setLanguageState(stored);
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem("language", lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // Optional: Show loading screen while loading language preference
  // if (isLoading) {
  //   return null; // or a loading component
  // }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

const translations = {
  en: {
    welcome: "Welcome, Raj!",
    dashboardSubtitle: "Your health dashboard at a glance",
    uploadReport: "Upload Report",
    addPhotos: "Add PDFs or images",
    myReports: "My Reports",
    viewReports: "View all reports",
    healthSummary: "Health Summary",
    aiInsights: "AI insights",
    bookTests: "Book Tests",
    homeCollection: "Home collection",
    bookSampleCollection: "Book sample collection at home",
    specialOffer: "Special Offer",
    discountText: "Get 20% off on all pathology packages. Use code HEALTH20",
    recommendedTests: "Recommended Tests",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    urgent: "Urgent",
    medium: "Medium",
    low: "Low",
    blood: "Blood",
    urine: "Urine",
    prescription: "Rx",
    scans: "Scans",
    other: "Other",
    myBookings: "My Bookings",
    paymentHistory: "Payment History",
    familyMembers: "Family Members",
    notifications: "Notifications",
    helpSupport: "Help & Support",
    logout: "Logout",
    settings: "Settings",
    language: "Language",
    english: "English",
    hindi: "Hindi",
    profile: "Profile",
    home: "Home",
    reports: "Reports",
    summary: "Summary",
    labs: "Labs",
    uploadTest: "Upload Test",
    addReport: "Add Report",
    allReports: "All Reports",
    date: "Date",
    status: "Status",
    download: "Download",
    aiInsight: "AI Insight",
    healthScore: "Health Score",
    keyFindings: "Key Findings",
    deficiencies: "Possible Deficiencies",
    lifestyle: "Lifestyle Suggestions",
    monthlyTests: "Monthly Recommended Tests",
    regenerate: "Regenerate",
    share: "Share",
    selectTest: "Select Test",
    selectDate: "Select Date",
    selectTime: "Select Time",
    enterAddress: "Enter Address",
    bookNow: "Book Now",
    rating: "Rating",
    price: "Price",
    turnaround: "Turnaround",
    days: "days",
    selectCategory: "Select Category",
    processed: "Processed",
    awaitingAI: "Awaiting AI",
    pending: "Pending",
    completed: "Completed",
    bookings: "Confirmed",
    categoryBlood: "Blood Tests",
    categoryThyroid: "Thyroid",
    categoryDiabetes: "Diabetes",
    categoryVitamins: "Vitamins",
    categoryFullbody: "Full Body Checkup",
    categoryKidney: "Kidney & Liver",
    categoryHormone: "Hormones",
    categoryUrine: "Urine Tests",
    categoryHeart: "Heart",
    categoryFertility: "Fertility",
    pathologyLabs: "Pathology Labs",
    back: "Back",
    resultsIn: "Result in",
    homeCollectionAvailable: "Home collection available",
    clinicVisitsOnly: "Clinic visits only",
    availableTests: "Available Tests",
    completeBloodCount: "Complete Blood Count",
    lipidProfile: "Lipid Profile",
    thyroidTSH: "Thyroid TSH",
    glucoseFasting: "Glucose Fasting",
    selectDateAndTime: "Select Date & Time",
    deliveryAddress: "Delivery Address",
    enterYourAddress: "Enter your address",
    proceedToPayment: "Proceed to Payment",
    bookTest: "Book Test",

    // Pharmacy Screen (Prescription Dispatch)
    sendPrescription: "Send Prescription",
    pharmacySubtitle: "Central Pharmacy – City Hub",
    uploadPrescription: "Upload Prescription",
    supportedFormats: "JPG / PNG / PDF supported",
    pickupInformation: "Pickup Information",
    hospital: "Hospital",
    address: "Address",
    doctor: "Doctor",
    contact: "Contact",
    expectedDelivery: "Expected Delivery",
    additionalInstructions: "Additional Instructions",
    notesPlaceholder: "Additional instructions for pharmacy (optional)",
    sendToPharmacy: "Send to Pharmacy",
    uploadingPrescription: "Uploading Prescription...",
    notifyingPharmacy: "Notifying Pharmacy...",
    pleaseWait: "Please do not close this screen",
    prescriptionSentSuccessfully: "Prescription Sent Successfully",
    processingShortly:
      "The pharmacy has received your prescription and will begin processing it shortly.",
    orderId: "Order ID",
    pharmacy: "Pharmacy",
    estimatedDispatch: "Estimated Dispatch",
    trackOrder: "Track Order",
    pendingReview: "Pending Review",
    waitingForPharmacy: "Waiting for pharmacy to review",
    acceptedByPharmacy: "Accepted by Pharmacy",
    preparingMedicines: "Preparing Medicines",
    outForDelivery: "Out for Delivery",
    delivered: "Delivered",
  },
  hi: {
    welcome: "स्वागत है, राज!",
    dashboardSubtitle: "आपके स्वास्थ्य डैशबोर्ड का एक नज़रिया",
    uploadReport: "रिपोर्ट अपलोड करें",
    addPhotos: "PDF या छवियां जोड़ें",
    myReports: "मेरी रिपोर्टें",
    viewReports: "सभी रिपोर्ट देखें",
    healthSummary: "स्वास्थ्य सारांश",
    aiInsights: "AI अंतर्दृष्टि",
    bookTests: "परीक्षण बुक करें",
    homeCollection: "घर पर संग्रह",
    bookSampleCollection: "घर पर नमूना संग्रह बुक करें",
    specialOffer: "विशेष ऑफर",
    discountText:
      "सभी पैथोलॉजी पैकेज पर 20% छूट प्राप्त करें। कोड HEALTH20 का उपयोग करें",
    recommendedTests: "अनुशंसित परीक्षण",
    monthly: "मासिक",
    quarterly: "त्रैमासिक",
    yearly: "वार्षिक",
    urgent: "तत्काल",
    medium: "मध्यम",
    low: "कम",
    blood: "रक्त",
    urine: "मूत्र",
    prescription: "प्रिस्क्रिप्शन",
    scans: "स्कैन",
    other: "अन्य",
    myBookings: "मेरी बुकिंग",
    paymentHistory: "भुगतान इतिहास",
    familyMembers: "परिवार के सदस्य",
    notifications: "सूचनाएं",
    helpSupport: "सहायता",
    logout: "लॉगआउट",
    settings: "सेटिंग्स",
    language: "भाषा",
    english: "अंग्रेजी",
    hindi: "हिंदी",
    profile: "प्रोफाइल",
    home: "होम",
    reports: "रिपोर्टें",
    summary: "सारांश",
    labs: "लैब्स",
    uploadTest: "परीक्षण अपलोड करें",
    addReport: "रिपोर्ट जोड़ें",
    allReports: "सभी रिपोर्टें",
    date: "तारीख",
    status: "स्थिति",
    download: "डाउनलोड",
    aiInsight: "AI अंतर्दृष्टि",
    healthScore: "स्वास्थ्य स्कोर",
    keyFindings: "मुख्य निष्कर्ष",
    deficiencies: "संभावित कमी",
    lifestyle: "जीवनशैली सुझाव",
    monthlyTests: "मासिक अनुशंसित परीक्षण",
    regenerate: "पुनः उत्पन्न करें",
    share: "साझा करें",
    selectTest: "परीक्षण चुनें",
    selectDate: "तारीख चुनें",
    selectTime: "समय चुनें",
    enterAddress: "पता दर्ज करें",
    bookNow: "अभी बुक करें",
    rating: "रेटिंग",
    price: "कीमत",
    turnaround: "समय",
    days: "दिन",
    selectCategory: "श्रेणी चुनें",
    processed: "संसाधित",
    awaitingAI: "AI के लिए प्रतीक्षा",
    pending: "लंबित",
    completed: "पूर्ण",
    bookings: "पुष्टि",
    categoryBlood: "रक्त परीक्षण",
    categoryThyroid: "थायराइड",
    categoryDiabetes: "डायबिटीज",
    categoryVitamins: "विटामिन्स",
    categoryFullbody: "संपूर्ण स्वास्थ्य",
    categoryKidney: "किडनी & लीवर",
    categoryHormone: "हार्मोन",
    categoryUrine: "यूरिन टेस्ट",
    categoryHeart: "हृदय",
    categoryFertility: "प्रजनन क्षमता",
    pathologyLabs: "पैथोलॉजी लैब्स",
    back: "वापस",
    resultsIn: "परिणाम में",
    homeCollectionAvailable: "घर पर संग्रह उपलब्ध",
    clinicVisitsOnly: "केवल क्लिनिक विजिट",
    availableTests: "उपलब्ध परीक्षण",
    completeBloodCount: "संपूर्ण रक्त गणना",
    lipidProfile: "लिपिड प्रोफाइल",
    thyroidTSH: "थायराइड TSH",
    glucoseFasting: "ग्लूकोज उपवास",
    selectDateAndTime: "तारीख और समय चुनें",
    deliveryAddress: "डिलीवरी पता",
    enterYourAddress: "अपना पता दर्ज करें",
    proceedToPayment: "भुगतान के लिए आगे बढ़ें",
    bookTest: "परीक्षण बुक करें",

    // Pharmacy Screen (Prescription Dispatch)
    sendPrescription: "प्रिस्क्रिप्शन भेजें",
    pharmacySubtitle: "सेंट्रल फार्मेसी - सिटी हब",
    uploadPrescription: "प्रिस्क्रिप्शन अपलोड करें",
    supportedFormats: "JPG / PNG / PDF समर्थित",
    pickupInformation: "पिकअप जानकारी",
    hospital: "अस्पताल",
    address: "पता",
    doctor: "डॉक्टर",
    contact: "संपर्क",
    expectedDelivery: "अपेक्षित डिलीवरी",
    additionalInstructions: "अतिरिक्त निर्देश",
    notesPlaceholder: "फार्मेसी के लिए अतिरिक्त निर्देश (वैकल्पिक)",
    sendToPharmacy: "फार्मेसी को भेजें",
    uploadingPrescription: "प्रिस्क्रिप्शन अपलोड हो रहा है...",
    notifyingPharmacy: "फार्मेसी को सूचित किया जा रहा है...",
    pleaseWait: "कृपया इस स्क्रीन को बंद न करें",
    prescriptionSentSuccessfully: "प्रिस्क्रिप्शन सफलतापूर्वक भेजा गया",
    processingShortly:
      "फार्मेसी को आपका प्रिस्क्रिप्शन मिल गया है और जल्द ही इसे संसाधित करना शुरू कर देगी।",
    orderId: "ऑर्डर आईडी",
    pharmacy: "फार्मेसी",
    estimatedDispatch: "अनुमानित प्रेषण",
    trackOrder: "ऑर्डर ट्रैक करें",
    pendingReview: "समीक्षा लंबित",
    waitingForPharmacy: "फार्मेसी की समीक्षा की प्रतीक्षा में",
    acceptedByPharmacy: "फार्मेसी द्वारा स्वीकृत",
    preparingMedicines: "दवाइयां तैयार हो रही हैं",
    outForDelivery: "डिलीवरी के लिए बाहर है",
    delivered: "पहुंचा दिया गया",
  },
};
