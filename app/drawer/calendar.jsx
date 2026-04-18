import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../src/store/AppContext';

/* ─── Constants ─────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const DOT_COLOR = {
  water:   '#0EA5E9', // Sky Blue
  fert:    '#F59E0B', // Amber
  pest:    '#8B5CF6', // Violet
  harvest: '#F43F5E', // Rose
  sow:     '#10B981', // Emerald
  prune:   '#78716C', // Stone
};

const PILL_STYLE = {
  watering:   { bg: '#E0F2FE', text: '#0284C7', border: '#0EA5E9' },
  fertiliser: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
  rain:       { bg: '#F3E8FF', text: '#7E22CE', border: '#8B5CF6' },
  sowing:     { bg: '#D1FAE5', text: '#059669', border: '#10B981' },
  harvest:    { bg: '#FFE4E6', text: '#E11D48', border: '#F43F5E' },
  pest:       { bg: '#F3E8FF', text: '#9333EA', border: '#8B5CF6' },
  pruning:    { bg: '#F5F5F4', text: '#57534E', border: '#78716C' },
};

/* ─── Task DB ───────────────────────────────────────────── */
const TASK_DB = {
  cashew: {
    0:  [
      { day:5,  nm:'Light Irrigation',    sub:'45 min · Morning',           ico:'💧', dot:'water',   pill:'watering'   },
      { day:12, nm:'Apply Potash',         sub:'100g MOP per tree',          ico:'🌿', dot:'fert',    pill:'fertiliser' },
      { day:20, nm:'Pest Inspection',      sub:'Check for thrips & hoppers', ico:'🔍', dot:'pest',    pill:'pest'       },
    ],
    1:  [
      { day:3,  nm:'Flowering Watch',      sub:'Inspect for bud drop',       ico:'🌸', dot:'sow',     pill:'sowing'     },
      { day:10, nm:'Apply NPK Fertiliser', sub:'500g per tree',              ico:'🌱', dot:'fert',    pill:'fertiliser' },
      { day:18, nm:'Morning Irrigation',   sub:'45 min · Cashew field',      ico:'💧', dot:'water',   pill:'watering'   },
    ],
    2:  [
      { day:4,  nm:'Morning Irrigation',   sub:'45 min · Cashew field',      ico:'💧', dot:'water',   pill:'watering'   },
      { day:9,  nm:'Apply NPK Fertiliser', sub:'2Kg per row',                ico:'🌱', dot:'fert',    pill:'fertiliser' },
      { day:15, nm:'Pest Spray',           sub:'Chlorpyrifos 2ml/L',         ico:'🛡️', dot:'pest',    pill:'pest'       },
      { day:22, nm:'Harvest Check',        sub:'Check for ripe cashew apples',ico:'🥜',dot:'harvest', pill:'harvest'    },
    ],
    3:  [ // April
      { day:3,  nm:'Morning Irrigation',   sub:'45 min · Cashew field',      ico:'💧', dot:'water',   pill:'watering'   },
      { day:7,  nm:'Apply NPK Fertiliser', sub:'2Kg per row',                ico:'🌱', dot:'fert',    pill:'fertiliser' },
      { day:12, nm:'Harvest Cashews',      sub:'Collect ripe cashew apples', ico:'🥜', dot:'harvest', pill:'harvest'    },
      { day:17, nm:'Pest Inspection',      sub:'Check stem & shoot borer',   ico:'🔍', dot:'pest',    pill:'pest'       },
      { day:22, nm:'Irrigation',           sub:'30 min · Drip system',       ico:'💧', dot:'water',   pill:'watering'   },
      { day:27, nm:'Apply Urea',           sub:'200g per tree top dress',    ico:'🌿', dot:'fert',    pill:'fertiliser' },
    ],
    4:  [
      { day:5,  nm:'Pre-Monsoon Pruning',  sub:'Remove dead wood',           ico:'✂️', dot:'prune',   pill:'pruning'    },
      { day:14, nm:'Apply Fungicide',      sub:'Copper oxychloride 3g/L',    ico:'🛡️', dot:'pest',    pill:'pest'       },
      { day:23, nm:'Last Harvest',         sub:'Collect remaining fruits',   ico:'🥜', dot:'harvest', pill:'harvest'    },
    ],
    5:  [
      { day:8,  nm:'Drain Check',          sub:'Clear waterlogged areas',    ico:'🌧️', dot:'water',   pill:'watering'   },
      { day:20, nm:'Weed Control',         sub:'Manual weeding around base', ico:'🌿', dot:'sow',     pill:'sowing'     },
    ],
    6:  [
      { day:6,  nm:'Soil Mulching',        sub:'Apply organic mulch 5cm',    ico:'🪨', dot:'sow',     pill:'sowing'     },
      { day:18, nm:'Monitor for Pests',    sub:'Check anthracnose signs',    ico:'🔍', dot:'pest',    pill:'pest'       },
    ],
    7:  [
      { day:10, nm:'Post-Monsoon Cleanup', sub:'Clear debris & fallen leaves',ico:'🧹',dot:'sow',    pill:'sowing'     },
    ],
    8:  [
      { day:4,  nm:'Apply Urea',           sub:'200g per tree',              ico:'🌿', dot:'fert',    pill:'fertiliser' },
      { day:16, nm:'Irrigation Resume',    sub:'Start drip after monsoon',   ico:'💧', dot:'water',   pill:'watering'   },
    ],
    9:  [
      { day:5,  nm:'Flowering Prep',       sub:'Apply phosphorus 100g/tree', ico:'🌸', dot:'fert',    pill:'fertiliser' },
      { day:19, nm:'Pest Spray',           sub:'Monocrotophos 1.5ml/L',      ico:'🛡️', dot:'pest',    pill:'pest'       },
    ],
    10: [
      { day:3,  nm:'Early Harvest Prep',   sub:'Prepare collection nets',    ico:'🥜', dot:'harvest', pill:'harvest'    },
      { day:14, nm:'Apply Potash',         sub:'150g MOP per tree',          ico:'🌿', dot:'fert',    pill:'fertiliser' },
      { day:25, nm:'Irrigation',           sub:'45 min · Morning',           ico:'💧', dot:'water',   pill:'watering'   },
    ],
    11: [
      { day:1,  nm:'Peak Harvest',         sub:'Collect mature cashew apples',ico:'🥜',dot:'harvest', pill:'harvest'    },
      { day:8,  nm:'Morning Irrigation',   sub:'45 min · Cashew field',      ico:'💧', dot:'water',   pill:'watering'   },
      { day:15, nm:'Apply NPK',            sub:'Full dose before season end', ico:'🌱', dot:'fert',    pill:'fertiliser' },
      { day:22, nm:'Harvest Cashews',      sub:'Final collection round',     ico:'🥜', dot:'harvest', pill:'harvest'    },
    ],
  },
  paddy: {
    2:  [
      { day:5,  nm:'Land Preparation',     sub:'Plough and level paddy field',ico:'🚜',dot:'sow',    pill:'sowing'     },
      { day:18, nm:'Seed Sowing',          sub:'Broadcast pre-soaked seeds', ico:'🌾', dot:'sow',     pill:'sowing'     },
    ],
    3:  [
      { day:6,  nm:'Top Dress Urea',       sub:'25kg/acre at tillering',     ico:'🌿', dot:'fert',    pill:'fertiliser' },
      { day:14, nm:'Blast Disease Check',  sub:'Monitor leaf lesions',       ico:'🔍', dot:'pest',    pill:'pest'       },
      { day:22, nm:'Irrigation',           sub:'Flood irrigate 5cm depth',   ico:'💧', dot:'water',   pill:'watering'   },
    ],
    4:  [
      { day:10, nm:'Apply Fungicide',      sub:'Tricyclazole 75% @ 0.6g/L', ico:'🛡️', dot:'pest',    pill:'pest'       },
      { day:20, nm:'Panicle Inspection',   sub:'Check for panicle blast',    ico:'🔍', dot:'pest',    pill:'pest'       },
    ],
    7:  [
      { day:3,  nm:'Harvest Paddy',        sub:'Combine harvest when 80% ripe',ico:'🌾',dot:'harvest',pill:'harvest'   },
      { day:15, nm:'Threshing',            sub:'Thresh and dry paddy',       ico:'🚜', dot:'harvest', pill:'harvest'    },
    ],
  },
};

const SEASON_PROG = { cashew: [98,80,50,20,68,40,60,70,75,80,92,98], paddy: [10,10,20,40,60,80,90,100,15,30,50,70] };
const CROP_STAGE = { cashew: ['Dormant','Bud Init','Flowering','Fruit Set','Fruit Dev','Pre-Harvest','Monsoon Rest','Monsoon Rest','Recovery','Pre-Flower','Early Flower','Peak Harvest'], paddy: ['Off Season','Off Season','Nursery','Transplanting','Tillering','Panicle','Heading','Harvest','Off Season','Off Season','Off Season','Off Season'] };
const CROP_ICON = { cashew:'🥜', paddy:'🌾', coconut:'🥥' };

/* ─── Task Card Component ───────────────────────────────── */
const TaskItem = ({ task, month }) => (
  <TouchableOpacity activeOpacity={0.7} style={styles.taskCard}>
    {/* Left color bar indicator */}
    <View style={[styles.taskColorBar, { backgroundColor: PILL_STYLE[task.pill]?.border }]} />

    <View style={[styles.taskIconBox, { backgroundColor: PILL_STYLE[task.pill]?.bg || '#F3F4F6' }]}>
      <Text style={styles.taskIconEmoji}>{task.ico}</Text>
    </View>

    <View style={styles.taskContent}>
      <Text style={[styles.taskDateHint, { color: PILL_STYLE[task.pill]?.border }]}>
        {MONTHS[month].slice(0,3)} {task.day} • {task.pill.toUpperCase()}
      </Text>
      <Text style={styles.taskName}>{task.nm}</Text>
      <Text style={styles.taskSub}>{task.sub}</Text>
    </View>

    {/* Empty Check Circle to make it look like a To-Do */}
    <View style={styles.checkCircle} />
  </TouchableOpacity>
);

/* ─── Main Component ────────────────────────────────────── */
export default function CalendarScreen() {
  const { user } = useApp();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const year = now.getFullYear();

  const crop = user?.crops?.[0] || 'cashew';
  const cropName = crop.charAt(0).toUpperCase() + crop.slice(1);
  const cropField = user?.fieldName || 'Field A, Sattari';
  const prog = (SEASON_PROG[crop] || SEASON_PROG.cashew)[month] ?? 50;

  const monthTasks = TASK_DB[crop]?.[month] || [];

  const tasksByDay = {};
  monthTasks.forEach(t => {
    if (!tasksByDay[t.day]) tasksByDay[t.day] = [];
    tasksByDay[t.day].push(t);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  // Default to today if viewing current month, else null
  const [selectedDay, setSelectedDay] = useState(now.getMonth() === month ? now.getDate() : null);

  // Tasks for the specifically selected day
  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] || []) : [];

  // If a day is selected, we ALSO want to show upcoming tasks in the month so the screen isn't empty
  const upcomingTasks = selectedDay
    ? monthTasks.filter(t => t.day > selectedDay)
    : [];

  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=15.4989&longitude=73.8278&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FKolkata')
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        const icon = c.weather_code <= 3 ? '🌤️' : c.weather_code <= 67 ? '🌧️' : '⛈️';
        setWeather({ temp: Math.round(c.temperature_2m), icon, desc: c.weather_code <= 3 ? 'Clear Skies' : 'Rain Expected' });
      })
      .catch(() => setWeather({ temp:'--', icon:'⛅', desc:'Weather Unavailable' }));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F6" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Action Plan</Text>
        <View style={styles.avatarPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Dashboard Top Row (Crop Info + Weather) */}
        <View style={styles.dashRow}>
          <View style={styles.cropDashCard}>
            <Text style={styles.cropIcoText}>{CROP_ICON[crop] || '🌾'}</Text>
            <Text style={styles.cropName}>{cropName}</Text>
            <Text style={styles.cropField}>{cropField}</Text>
            <View style={styles.progBarWrap}>
              <View style={[styles.progBarFill, { width: `${prog}%` }]} />
            </View>
          </View>

          <LinearGradient colors={['#10B981', '#059669']} style={styles.weatherDashCard}>
            {!weather ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.weatherIconLarge}>{weather.icon}</Text>
                <Text style={styles.tempText}>{weather.temp}°</Text>
                <Text style={styles.weatherDesc}>{weather.desc}</Text>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Calendar Section */}
        <View style={styles.calCard}>
          <View style={styles.monthNav}>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.navBtn} onPress={() => { setMonth(m => m===0?11:m-1); setSelectedDay(null); }}>
                <Text style={styles.navBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => { setMonth(m => m===11?0:m+1); setSelectedDay(null); }}>
                <Text style={styles.navBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calRow}>
            {DAYS_SHORT.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
          </View>

          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={styles.calCell} />;

              const isToday = now.getFullYear()===year && now.getMonth()===month && now.getDate()===day;
              const isSelected = selectedDay === day;
              const dots = [...new Set((tasksByDay[day]||[]).map(t=>t.dot))].slice(0,3);

              return (
                <TouchableOpacity key={`d${day}`} activeOpacity={0.6} style={styles.calCell} onPress={() => setSelectedDay(day)}>
                  <View style={[styles.dayCircle, isSelected && styles.daySelected, isToday && !isSelected && styles.dayToday]}>
                    <Text style={[styles.dayNum, (isSelected || isToday) && styles.dayNumHL]}>{day}</Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dots.map(type => <View key={type} style={[styles.dot, { backgroundColor: DOT_COLOR[type]||'#aaa' }]} />)}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksContainer}>
          {selectedDay === null ? (
            // User deselected a day, showing entire month
            <>
              <Text style={styles.taskHeaderTitle}>All Tasks in {MONTHS[month]}</Text>
              {monthTasks.length === 0 && (
                <Text style={styles.emptyText}>No tasks scheduled this month.</Text>
              )}
              {monthTasks.map((task, i) => <TaskItem key={i} task={task} month={month} />)}
            </>
          ) : (
            // A specific day is selected
            <>
              <View style={styles.selectedDayHeader}>
                <Text style={styles.taskHeaderTitle}>Schedule for {MONTHS[month]} {selectedDay}</Text>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Text style={styles.clearSelectionText}>View All</Text>
                </TouchableOpacity>
              </View>

              {/* Tasks for the selected day */}
              {selectedTasks.length > 0 ? (
                selectedTasks.map((task, i) => <TaskItem key={`s-${i}`} task={task} month={month} />)
              ) : (
                <View style={styles.freeDayCard}>
                  <Text style={styles.freeDayEmoji}>☕</Text>
                  <View>
                    <Text style={styles.freeDayTitle}>Clear Schedule</Text>
                    <Text style={styles.freeDaySub}>You have no tasks set for today.</Text>
                  </View>
                </View>
              )}

              {/* Upcoming tasks to prevent empty screen UX */}
              {upcomingTasks.length > 0 && (
                <>
                  <Text style={[styles.taskHeaderTitle, { marginTop: 24 }]}>Coming up next</Text>
                  {upcomingTasks.slice(0, 3).map((task, i) => <TaskItem key={`u-${i}`} task={task} month={month} />)}
                </>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' }, // Very soft cool grey-green
  scrollContent: { paddingBottom: 60 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  backArrow: { fontSize: 20, color: '#111827', fontWeight: '800' },
  headerTitle: { fontSize: 18, color: '#111827', fontWeight: '800' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' }, // Placeholder for balance

  // Dashboard Row
  dashRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 12 },
  cropDashCard: { flex: 1.5, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cropIcoText: { fontSize: 32, marginBottom: 8 },
  cropName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  cropField: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  progBarWrap: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  progBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },

  weatherDashCard: { flex: 1, padding: 16, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  weatherIconLarge: { fontSize: 32, marginBottom: 4 },
  tempText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  weatherDesc: { fontSize: 11, color: '#D1FAE5', fontWeight: '600', textAlign: 'center', marginTop: 2 },

  // Calendar
  calCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 12, borderRadius: 32, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  monthTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  navButtons: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 18, color: '#374151', fontWeight: '600', lineHeight: 20 },

  calRow: { flexDirection: 'row', marginBottom: 10 },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dayToday: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  daySelected: { backgroundColor: '#111827', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  dayNum: { fontSize: 15, fontWeight: '600', color: '#374151' },
  dayNumHL: { color: '#FFFFFF', fontWeight: '800' },
  dotRow: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  // Tasks Container
  tasksContainer: { paddingHorizontal: 20, marginTop: 24 },
  selectedDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  taskHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5, marginBottom: 16 },
  clearSelectionText: { fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 18 },

  // Empty State / Free Day Card
  freeDayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed', marginBottom: 16 },
  freeDayEmoji: { fontSize: 28, marginRight: 16 },
  freeDayTitle: { fontSize: 16, fontWeight: '800', color: '#374151' },
  freeDaySub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', textAlign: 'center', marginTop: 20 },

  // Task Item
  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1, overflow: 'hidden' },
  taskColorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  taskIconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginRight: 16 },
  taskIconEmoji: { fontSize: 24 },
  taskContent: { flex: 1 },
  taskDateHint: { fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  taskName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  taskSub: { fontSize: 13, color: '#6B7280' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', marginLeft: 12 },
});