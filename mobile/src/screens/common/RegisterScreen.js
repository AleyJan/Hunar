import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [sector, setSector] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !phone || !password) {
            Alert.alert('Error', 'Name, phone aur password zaroor bharen');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password kam az kam 6 characters ka hona chahiye');
            return;
        }
        setLoading(true);
        try {
            await register({ name, phone, password, sector });
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || 'Kuch masla hua.');
        } finally {
            setLoading(false);
        }
    };

    const sectors = ['G-9', 'G-10', 'G-11', 'G-12', 'G-13', 'G-14', 'G-15', 'F-10', 'F-11', 'I-8'];

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={THEME.colors.white} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.sub}>HUNAR join karein — free hai!</Text>
                </View>

                <View style={styles.form}>
                    {[
                        { label: 'Full Name', value: name, set: setName, placeholder: 'Ahmed Ali', icon: 'person-outline', keyboard: 'default' },
                        { label: 'Phone Number', value: phone, set: setPhone, placeholder: '03XXXXXXXXX', icon: 'call-outline', keyboard: 'phone-pad' },
                        { label: 'Password', value: password, set: setPassword, placeholder: 'Min 6 characters', icon: 'lock-closed-outline', keyboard: 'default', secure: true },
                    ].map((field, i) => (
                        <View key={i} style={styles.inputGroup}>
                            <Text style={styles.label}>{field.label}</Text>
                            <View style={styles.inputRow}>
                                <Ionicons name={field.icon} size={18} color={THEME.colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={field.placeholder}
                                    placeholderTextColor={THEME.colors.textMuted}
                                    value={field.value}
                                    onChangeText={field.set}
                                    keyboardType={field.keyboard}
                                    secureTextEntry={field.secure}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    ))}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Aapka Sector (optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.sectorRow}>
                                {sectors.map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.sectorChip, sector === s && styles.sectorChipActive]}
                                        onPress={() => setSector(s)}
                                    >
                                        <Text style={[styles.sectorText, sector === s && styles.sectorTextActive]}>
                                            {s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[styles.btnRegister, loading && { opacity: 0.7 }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={THEME.colors.white} />
                            : <Text style={styles.btnText}>Account Banayein</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginText}>
                            Account hai? <Text style={styles.loginBold}>Login karein</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.primaryDark },
    content: { padding: 24, paddingTop: 60, flexGrow: 1 },
    back: { marginBottom: 32 },
    header: { marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '900', color: THEME.colors.white },
    sub: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
    form: { gap: 18 },
    inputGroup: { gap: 8 },
    label: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14, paddingVertical: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: THEME.colors.white, fontSize: 15 },
    sectorRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    sectorChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    sectorChipActive: {
        backgroundColor: THEME.colors.accent,
        borderColor: THEME.colors.accent,
    },
    sectorText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    sectorTextActive: { color: THEME.colors.primaryDark },
    btnRegister: {
        backgroundColor: THEME.colors.accent, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
        marginTop: 8, ...THEME.shadows.float,
    },
    btnText: { color: THEME.colors.primaryDark, fontSize: 16, fontWeight: '800' },
    loginLink: { alignItems: 'center', marginTop: 8 },
    loginText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    loginBold: { color: THEME.colors.accent, fontWeight: '700' },
});