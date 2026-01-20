// screens/LabsScreen.tsx
import HealthCard from "@/components/common/health-card";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type Category =
  | "blood"
  | "thyroid"
  | "diabetes"
  | "vitamins"
  | "fullbody"
  | "kidney"
  | "hormone"
  | "urine"
  | "heart"
  | "fertility";

interface Lab {
  id: string;
  name: string;
  rating: number;
  price: number;
  homeCollection: boolean;
  turnaround: string;
  category: Category;
}

export default function LabsScreen() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<Category>("blood");
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState("");
  const [selectedTests, setSelectedTests] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
    3: false,
  });

  const categories: { id: Category; labelKey: string }[] = [
    { id: "blood", labelKey: "categoryBlood" },
    { id: "thyroid", labelKey: "categoryThyroid" },
    { id: "diabetes", labelKey: "categoryDiabetes" },
    { id: "vitamins", labelKey: "categoryVitamins" },
    { id: "fullbody", labelKey: "categoryFullbody" },
    { id: "kidney", labelKey: "categoryKidney" },
    { id: "hormone", labelKey: "categoryHormone" },
    { id: "urine", labelKey: "categoryUrine" },
    { id: "heart", labelKey: "categoryHeart" },
    { id: "fertility", labelKey: "categoryFertility" },
  ];

  const labs: Lab[] = [
    // Blood Tests
    {
      id: "1",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "2",
      name: "Diagnostics India",
      rating: 4.8,
      price: 450,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "3",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "4",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 550,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "5",
      name: "Thyrocare",
      rating: 4.9,
      price: 399,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "6",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 549,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "7",
      name: "PathLabs India",
      rating: 4.6,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "8",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "9",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "10",
      name: "Medical Checkup Center",
      rating: 4.6,
      price: 450,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "11",
      name: "Care Lab Services",
      rating: 4.7,
      price: 529,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },
    {
      id: "12",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 600,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "blood",
    },

    // Thyroid
    {
      id: "13",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "14",
      name: "Thyrocare",
      rating: 4.9,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "15",
      name: "Thyroid Specialists Lab",
      rating: 4.8,
      price: 549,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "16",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 649,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "17",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "18",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "19",
      name: "Diagnostics India",
      rating: 4.8,
      price: 550,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "20",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "21",
      name: "PathLabs India",
      rating: 4.6,
      price: 549,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "thyroid",
    },
    {
      id: "22",
      name: "Care Lab Services",
      rating: 4.7,
      price: 599,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "23",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 650,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },
    {
      id: "24",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 699,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "thyroid",
    },

    // Diabetes
    {
      id: "25",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "26",
      name: "Diabetes Care Labs",
      rating: 4.8,
      price: 399,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "27",
      name: "Thyrocare",
      rating: 4.9,
      price: 349,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "28",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "29",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "30",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "31",
      name: "Diagnostics India",
      rating: 4.8,
      price: 400,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "32",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "33",
      name: "PathLabs India",
      rating: 4.6,
      price: 399,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "34",
      name: "Care Lab Services",
      rating: 4.7,
      price: 449,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "35",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 499,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },
    {
      id: "36",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 549,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "diabetes",
    },

    // Vitamins
    {
      id: "37",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "38",
      name: "Vitamins Check Center",
      rating: 4.8,
      price: 799,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "39",
      name: "Thyrocare",
      rating: 4.9,
      price: 749,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "40",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "41",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "42",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "43",
      name: "Diagnostics India",
      rating: 4.8,
      price: 799,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "44",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 849,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "45",
      name: "PathLabs India",
      rating: 4.6,
      price: 749,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "46",
      name: "Care Lab Services",
      rating: 4.7,
      price: 899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "47",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },
    {
      id: "48",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 949,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "vitamins",
    },

    // Full Body
    {
      id: "49",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 2499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "50",
      name: "Full Body Checkup Center",
      rating: 4.8,
      price: 2299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "51",
      name: "Thyrocare",
      rating: 4.9,
      price: 1999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "52",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 2499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "53",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 2799,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "54",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 2499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "55",
      name: "Diagnostics India",
      rating: 4.8,
      price: 2199,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "56",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 2399,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "57",
      name: "PathLabs India",
      rating: 4.6,
      price: 1999,
      homeCollection: true,
      turnaround: "72 hrs",
      category: "fullbody",
    },
    {
      id: "58",
      name: "Care Lab Services",
      rating: 4.7,
      price: 2499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "59",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 2999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },
    {
      id: "60",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 2699,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fullbody",
    },

    // Kidney & Liver
    {
      id: "61",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 749,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "62",
      name: "Kidney Liver Specialist Lab",
      rating: 4.8,
      price: 699,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "63",
      name: "Thyrocare",
      rating: 4.9,
      price: 649,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "64",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 749,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "65",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 799,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "66",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 749,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "67",
      name: "Diagnostics India",
      rating: 4.8,
      price: 699,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "68",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 749,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "69",
      name: "PathLabs India",
      rating: 4.6,
      price: 649,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "70",
      name: "Care Lab Services",
      rating: 4.7,
      price: 749,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "71",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 799,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },
    {
      id: "72",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 849,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "kidney",
    },

    // Hormones
    {
      id: "73",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "74",
      name: "Hormone Analysis Center",
      rating: 4.8,
      price: 1199,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "75",
      name: "Thyrocare",
      rating: 4.9,
      price: 999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "76",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "77",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 1399,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "78",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "79",
      name: "Diagnostics India",
      rating: 4.8,
      price: 1199,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "80",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 1249,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "81",
      name: "PathLabs India",
      rating: 4.6,
      price: 999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "82",
      name: "Care Lab Services",
      rating: 4.7,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "83",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 1499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },
    {
      id: "84",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 1349,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "hormone",
    },

    // Urine Tests
    {
      id: "85",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 299,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "86",
      name: "Urine Test Specialists",
      rating: 4.8,
      price: 249,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "87",
      name: "Thyrocare",
      rating: 4.9,
      price: 199,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "88",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 299,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "89",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 349,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "90",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 299,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "91",
      name: "Diagnostics India",
      rating: 4.8,
      price: 249,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "92",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 299,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "93",
      name: "PathLabs India",
      rating: 4.6,
      price: 199,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "94",
      name: "Care Lab Services",
      rating: 4.7,
      price: 299,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "95",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 349,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },
    {
      id: "96",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 329,
      homeCollection: true,
      turnaround: "24 hrs",
      category: "urine",
    },

    // Heart
    {
      id: "97",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 1599,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "98",
      name: "Heart Health Center",
      rating: 4.8,
      price: 1499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "99",
      name: "Thyrocare",
      rating: 4.9,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "100",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 1599,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "101",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 1699,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "102",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 1599,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "103",
      name: "Diagnostics India",
      rating: 4.8,
      price: 1499,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "104",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 1549,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "105",
      name: "PathLabs India",
      rating: 4.6,
      price: 1299,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "106",
      name: "Care Lab Services",
      rating: 4.7,
      price: 1599,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "107",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 1799,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },
    {
      id: "108",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 1649,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "heart",
    },

    // Fertility
    {
      id: "109",
      name: "Apollo Diagnostics",
      rating: 4.9,
      price: 1999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "110",
      name: "Fertility Center",
      rating: 4.8,
      price: 1899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "111",
      name: "Thyrocare",
      rating: 4.9,
      price: 1699,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "112",
      name: "SRL Diagnostics",
      rating: 4.8,
      price: 1999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "113",
      name: "Max Healthcare Labs",
      rating: 4.8,
      price: 2099,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "114",
      name: "Fortis Health Labs",
      rating: 4.7,
      price: 1999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "115",
      name: "Diagnostics India",
      rating: 4.8,
      price: 1899,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "116",
      name: "Health Hub Labs",
      rating: 4.7,
      price: 1949,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "117",
      name: "PathLabs India",
      rating: 4.6,
      price: 1699,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "118",
      name: "Care Lab Services",
      rating: 4.7,
      price: 1999,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "119",
      name: "Premium Diagnostics",
      rating: 4.9,
      price: 2199,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
    {
      id: "120",
      name: "LabsAdvisor Pro",
      rating: 4.8,
      price: 2049,
      homeCollection: true,
      turnaround: "48 hrs",
      category: "fertility",
    },
  ]

  const filteredLabs = labs.filter((l) => l.category === activeCategory);

  const toggleTest = (index: number) => {
    setSelectedTests((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Lab Detail View
  if (selectedLab) {
    return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>

      <ScrollView>
        <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
          <Pressable onPress={() => setSelectedLab(null)} className="mb-6">
            <Text className="text-primary font-medium">← {t("back")}</Text>
          </Pressable>

          <HealthCard className="p-6 mb-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
              {selectedLab.name}
            </Text>
            <View className="flex-row items-center gap-1 mb-4">
              <Text className="text-yellow-500">★</Text>
              <Text className="font-medium text-foreground">{selectedLab.rating}</Text>
              <Text className="text-muted-foreground text-sm">
                (2.5k {t("rating")}s)
              </Text>
            </View>

            <View className="gap-3 mb-6">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="clock-outline" size={18} color="#2563eb" />
                <Text className="text-muted-foreground">
                  {t("resultsIn")} {selectedLab.turnaround}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons 
                  name="home" 
                  size={18} 
                  color={selectedLab.homeCollection ? "#16a34a" : "#666"}
                />
                <Text className="text-muted-foreground">
                  {selectedLab.homeCollection ? t("homeCollectionAvailable") : t("clinicVisitsOnly")}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-primary">₹{selectedLab.price}</Text>
            </View>

            <View className="mb-6">
              <Text className="font-semibold text-foreground mb-3">
                {t("availableTests")}
              </Text>
              <View className="gap-2">
                {[
                  t("completeBloodCount"),
                  t("lipidProfile"),
                  t("thyroidTSH"),
                  t("glucoseFasting"),
                ].map((test, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => toggleTest(idx)}
                    className="flex-row items-center gap-3 p-3 border border-border rounded-lg active:bg-muted/50"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 items-center justify-center ${
                        selectedTests[idx]
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {selectedTests[idx] && (
                        <MaterialCommunityIcons name="check" size={14} color="#fff" />
                      )}
                    </View>
                    <Text className="text-sm font-medium text-foreground">{test}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="font-semibold text-foreground mb-3">
                {t("selectDateAndTime")}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between px-4 py-3 border border-border rounded-lg bg-background"
              >
                <Text className="text-foreground">{formatDateTime(selectedDate)}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View className="mb-6">
              <Text className="font-semibold text-foreground mb-3">
                {t("deliveryAddress")}
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t("enterYourAddress")}
                placeholderTextColor="#999"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground"
                multiline
                numberOfLines={3}
              />
            </View>

            <Pressable className="health-button-primary w-full items-center">
              <Text className="text-primary-foreground font-medium">
                {t("proceedToPayment")}
              </Text>
            </Pressable>
          </HealthCard>
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  }

  // Labs List View
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
    <ScrollView >
      <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t("pathologyLabs")}
        </Text>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerClassName="gap-2 pb-2"
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-full ${
                activeCategory === cat.id
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  activeCategory === cat.id
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Labs List */}
        {filteredLabs.length > 0 ? (
          <View className="gap-3">
            {filteredLabs.map((lab) => (
              <Pressable key={lab.id}>
                <HealthCard className="p-4">
                  <View className="mb-3">
                    <Text className="font-semibold text-foreground">{lab.name}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Text className="text-yellow-500">★</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {lab.rating}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1">
                      <Text className="text-muted-foreground text-xs">{t("price")}</Text>
                      <Text className="font-semibold text-primary">₹{lab.price}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-muted-foreground text-xs">
                        {t("turnaround")}
                      </Text>
                      <Text className="font-semibold text-foreground">
                        {lab.turnaround}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-muted-foreground text-xs">
                        {t("homeCollection")}
                      </Text>
                      <Text
                        className={`font-semibold ${
                          lab.homeCollection
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {lab.homeCollection ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>

                  <Pressable className="health-button-secondary w-full py-2 items-center"  onPress={() => setSelectedLab(lab)}>
                    <Text className="text-primary font-medium text-sm">
                      {t("bookTest")}
                    </Text>
                  </Pressable>
                </HealthCard>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="py-12 items-center">
            <MaterialCommunityIcons 
              name="flask-empty-outline" 
              size={64} 
              color="#ccc" 
            />
            <Text className="text-muted-foreground mt-4 text-center">
              No labs available in this category yet
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}