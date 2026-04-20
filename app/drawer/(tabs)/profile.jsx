import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, StatusBar, Dimensions, Modal, Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useApp } from '../../../src/store/AppContext';

function SettingRow({ name, label, sublabel, right, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7} disabled={!onPress && !right}>
      <View style={[styles.settingIcon, danger && { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name={name} size={20} color={danger ? '#EF4444' : '#10B981'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        {sublabel ? <Text style={styles.settingSub}>{sublabel}</Text> : null}
      </View>
      {right || <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useApp();
  const { t, i18n } = useTranslation();
  const [notifOn, setNotifOn] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const cropsCount = (user?.crops || []).length;
  const initials = user?.name?.[0]?.toUpperCase() || 'F';

  const languageNames = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    mr: 'मराठी (Marathi)',
    kok: 'कोंकणी (Konkani)'
  };
  const currentLangName = languageNames[i18n.language] || 'English';

  const handleLogout = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: async () => { await logout(); router.replace('/onboard'); } },
    ]);
  };

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setLangModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* HERO */}
        <LinearGradient colors={['#064E3B', '#10B981']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.heroName}>{user?.name || t('profile.farmer')}</Text>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>{user?.taluka || 'Goa'}, India</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.glassEditBtn}>
                <Feather name="edit-3" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* STATS */}
            <View style={styles.statsBento}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{cropsCount}</Text>
                <Text style={styles.statLbl}>{t('profile.activeCrops')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{user?.farmSize || '0'}</Text>
                <Text style={styles.statLbl}>{t('profile.acres')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{user?.soil?.split(' ')[0] || 'Laterite'}</Text>
                <Text style={styles.statLbl}>{t('profile.soilType')}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* FARM TOOLS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.farmTools')}</Text>
          <View style={styles.card}>
            <SettingRow name="calendar-outline" label={t('profile.cropCalendar')} sublabel={t('profile.cropCalendarSub')} onPress={() => router.push('/drawer/calendar')} />
            <SettingRow name="leaf-outline" label={t('profile.soilAdvisor')} sublabel={t('profile.soilAdvisorSub')} onPress={() => router.push('/soilAdvisor')} />
            <SettingRow name="water-outline" label={t('profile.irrigationLog')} sublabel={t('profile.irrigationLogSub')} onPress={() => router.push('/irrigation')} />
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
          <View style={styles.card}>
            <SettingRow
              name="notifications-outline"
              label={t('profile.pushNotif')}
              sublabel={t('profile.pushNotifSub')}
              onPress={() => setNotifOn(!notifOn)}
              right={
                <TouchableOpacity onPress={() => setNotifOn(!notifOn)} style={[styles.toggleBase, notifOn && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, notifOn && styles.toggleKnobActive]} />
                </TouchableOpacity>
              }
            />
            {/* 🌐 LANGUAGE SWITCHER ROW */}
            <SettingRow
              name="language-outline"
              label={t('profile.appLang')}
              sublabel={currentLangName}
              onPress={() => setLangModalVisible(true)}
            />
            <SettingRow name="help-buoy-outline" label={t('profile.support')} sublabel={t('profile.supportSub')} />
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow name="log-out-outline" label={t('profile.signOut')} danger onPress={handleLogout} />
          </View>
          <Text style={styles.versionTxt}>AgroGROW v2.4.0 • Build 2026</Text>
        </View>

      </ScrollView>

      {/* LANGUAGE MODAL */}
      <Modal visible={langModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setLangModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('profile.appLang')}</Text>

            {Object.entries(languageNames).map(([code, name]) => (
              <TouchableOpacity
                key={code}
                style={[styles.langOption, i18n.language === code && styles.langOptionActive]}
                onPress={() => changeLanguage(code)}
              >
                <Text style={[styles.langOptionText, i18n.language === code && styles.langOptionTextActive]}>
                  {name}
                </Text>
                {i18n.language === code && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { paddingBottom: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  heroContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 10 },
  avatarBorder: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', padding: 4 },
  avatar: { flex: 1, backgroundColor: '#FFF', borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#10B981' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start' },
  locationText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 5 },
  glassEditBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  statsBento: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 25, marginTop: 25, borderRadius: 24, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statLbl: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginTop: 4 },
  statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  settingIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  settingLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  settingSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },

  toggleBase: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0', padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#10B981' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  toggleKnobActive: { alignSelf: 'flex-end' },

  versionTxt: { textAlign: 'center', marginTop: 20, color: '#CBD5E1', fontSize: 11, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  langOptionActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  langOptionText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  langOptionTextActive: { color: '#059669', fontWeight: '800' }
});