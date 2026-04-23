import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PRIMARY = "#2A5FB7";
const PRIMARY_SOFT = "rgba(42,95,183,0.12)";

export type PaymentMethod = "jazzcash" | "easypaisa" | "card" | "bank";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
  { id: "jazzcash", label: "JazzCash", icon: "cellphone", color: "#E3000B" },
  { id: "easypaisa", label: "Easypaisa", icon: "cellphone-wireless", color: "#24A148" },
  { id: "card", label: "Debit / Credit Card", icon: "credit-card-outline", color: "#2A5FB7" },
  { id: "bank", label: "Bank Transfer", icon: "bank-outline", color: "#7C3AED" },
];

export interface PaymentSummary {
  doctorName?: string;
  doctorImage?: string | null;
  doctorSpecialty?: string;
  dateStr?: string;
  timeStr?: string;
  typeStr?: string;
  consultFee: number;
  platformFee?: number;
}

export interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onPay: (paymentMethod: PaymentMethod, input: string) => Promise<void>;
  summary: PaymentSummary;
  isProcessing?: boolean;
}

const getInitials = (name: string) => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export function PaymentSheet({ visible, onClose, onPay, summary, isProcessing = false }: PaymentSheetProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("jazzcash");
  const [paymentInput, setPaymentInput] = useState("");

  const platformFee = summary.platformFee ?? 0;
  const totalFee = summary.consultFee + platformFee;

  const paymentInputLabel =
    selectedPayment === "jazzcash" ? "JazzCash Mobile Number"
    : selectedPayment === "easypaisa" ? "Easypaisa Mobile Number"
    : selectedPayment === "card" ? "Card Number"
    : "IBAN / Account Number";

  const paymentInputPlaceholder =
    selectedPayment === "card" ? "XXXX  XXXX  XXXX  XXXX"
    : selectedPayment === "bank" ? "PK00XXXX0000000000000000"
    : "03XX-XXXXXXX";

  const handlePayPress = () => {
    onPay(selectedPayment, paymentInput);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <View style={{ backgroundColor: "#F9FAFB", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" }}>

          {/* Handle + Header */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "#fff" }}>
            <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }}>Secure Payment</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

            {/* ── Order Summary ── */}
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
                Appointment Summary
              </Text>

              {/* Doctor row */}
              {summary.doctorName && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", marginBottom: 14 }}>
                  {summary.doctorImage ? (
                    <Image source={{ uri: summary.doctorImage }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E5E7EB" }} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY_SOFT, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: PRIMARY }}>{getInitials(summary.doctorName || "DR")}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1F2937" }}>{summary.doctorName}</Text>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>{summary.doctorSpecialty || "Specialist"}</Text>
                  </View>
                </View>
              )}

              {summary.dateStr && <SummaryRow icon="calendar" label="Date" value={summary.dateStr} />}
              {summary.timeStr && <SummaryRow icon="clock-outline" label="Time" value={summary.timeStr} />}
              {summary.typeStr && <SummaryRow icon="stethoscope" label="Type" value={summary.typeStr} />}

              {/* Fee breakdown */}
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>Consultation Fee</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F2937" }}>
                    {summary.consultFee > 0 ? `Rs. ${summary.consultFee.toLocaleString()}` : "Free"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>Platform Fee</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#16A34A" }}>
                    {platformFee > 0 ? `Rs. ${platformFee.toLocaleString()}` : "Free"}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#1F2937" }}>Total Due</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: PRIMARY }}>
                    Rs. {totalFee.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Payment Methods ── */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 12 }}>Payment Method</Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {PAYMENT_METHODS.map((pm) => {
                const active = selectedPayment === pm.id;
                return (
                  <Pressable
                    key={pm.id}
                    onPress={() => { setSelectedPayment(pm.id); setPaymentInput(""); }}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 14,
                      backgroundColor: active ? "#EEF2FF" : "#fff",
                      borderRadius: 14, padding: 14,
                      borderWidth: 1.5,
                      borderColor: active ? PRIMARY : "#E5E7EB",
                      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: active ? 0 : 1,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: active ? "#fff" : "#F9FAFB", borderWidth: 1, borderColor: active ? "#C7D2FE" : "#E5E7EB" }}>
                      <MaterialCommunityIcons name={pm.icon} size={20} color={active ? PRIMARY : pm.color} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: active ? PRIMARY : "#374151" }}>{pm.label}</Text>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: active ? PRIMARY : "#D1D5DB", alignItems: "center", justifyContent: "center" }}>
                      {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY }} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Payment Input ── */}
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 }}>{paymentInputLabel}</Text>
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 2, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name={selectedPayment === "card" ? "credit-card-outline" : selectedPayment === "bank" ? "bank-outline" : "cellphone"}
                size={18} color="#9CA3AF"
              />
              <TextInput
                style={{ flex: 1, paddingVertical: 13, fontSize: 15, color: "#1F2937", letterSpacing: selectedPayment === "card" ? 2 : 0 }}
                placeholder={paymentInputPlaceholder}
                placeholderTextColor="#D1D5DB"
                keyboardType={selectedPayment === "card" || selectedPayment === "bank" ? "default" : "phone-pad"}
                value={paymentInput}
                onChangeText={setPaymentInput}
                maxLength={selectedPayment === "card" ? 19 : 30}
              />
            </View>
            <Text style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 28, marginLeft: 4 }}>
              🔒 Your payment info is encrypted and secure
            </Text>

            {/* ── Pay Button ── */}
            <Pressable
              onPress={handlePayPress}
              disabled={isProcessing}
              style={{ borderRadius: 14, overflow: "hidden", opacity: isProcessing ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 }}
              >
                {isProcessing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialCommunityIcons name="shield-check" size={22} color="#fff" />
                }
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
                  {isProcessing ? "Confirming..." : `Pay Rs. ${totalFee.toLocaleString()} & Book`}
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 14 }}>
              By tapping Pay, you agree to our terms of service.{"\n"}Refunds subject to cancellation policy.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <MaterialCommunityIcons name={icon} size={16} color="#9CA3AF" />
      <Text style={{ fontSize: 13, color: "#6B7280", width: 50 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F2937", flex: 1 }}>{value}</Text>
    </View>
  );
}
