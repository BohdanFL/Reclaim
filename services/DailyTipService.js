import { MMKV } from 'react-native-mmkv';

// Initialize storage
export const tipStorage = new MMKV({
  id: 'tips-storage',
  encryptionKey: 'tips-key'
});

// Categories for tips
export const TIP_CATEGORIES = {
  PRODUCTIVITY: 'Продуктивність',
  DIGITAL_DETOX: 'Цифровий детокс',
  SLEEP: 'Сон',
  MENTAL_HEALTH: "Ментальне здоров'я",
  PHYSICAL_HEALTH: "Фізичне здоров'я",
  SOCIAL: 'Соціальне життя'
};

// Daily tips in Ukrainian with scientific sources
export const dailyTips = [
  {
    id: '1',
    text: "Обмеження використання соцмереж до 30 хвилин на день може значно покращити самопочуття та зменшити відчуття самотності та депресії.",
    category: TIP_CATEGORIES.MENTAL_HEALTH,
    sourceName: "Journal of Social and Clinical Psychology",
    sourceUrl: "https://guilfordjournals.com/doi/10.1521/jscp.2018.37.10.751"
  },
  {
    id: '2',
    text: "Синє світло від екранів перед сном пригнічує вироблення мелатоніну, що ускладнює засинання. Уникайте гаджетів за годину до сну.",
    category: TIP_CATEGORIES.SLEEP,
    sourceName: "Sleep Foundation",
    sourceUrl: "https://www.sleepfoundation.org/bedroom-environment/blue-light"
  },
  {
    id: '3',
    text: "Регулярні короткі перерви під час роботи чи навчання (техніка Pomodoro) допомагають підтримувати концентрацію та запобігають вигоранню.",
    category: TIP_CATEGORIES.PRODUCTIVITY,
    sourceName: "Journal of Applied Psychology",
    sourceUrl: "https://psycnet.apa.org/record/2016-48832-001"
  },
  {
    id: '4',
    text: "Багатозадачність знижує продуктивність до 40% та збільшує кількість помилок. Сфокусуйтеся на одному завданні за раз.",
    category: TIP_CATEGORIES.PRODUCTIVITY,
    sourceName: "American Psychological Association",
    sourceUrl: "https://www.apa.org/research/action/multitask"
  },
  {
    id: '5',
    text: "Фізична активність, навіть коротка прогулянка, покращує настрій та когнітивні функції, допомагаючи боротися з бажанням безцільно скролити.",
    category: TIP_CATEGORIES.PHYSICAL_HEALTH,
    sourceName: "Mayo Clinic",
    sourceUrl: "https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/exercise-and-stress/art-20044469"
  },
  {
    id: '6',
    text: "Встановлення чітких 'цифрових кордонів', наприклад, визначення часу без гаджетів протягом дня, сприяє кращому балансу між онлайн та офлайн життям.",
    category: TIP_CATEGORIES.DIGITAL_DETOX,
    sourceName: "Digital Wellness Institute",
    sourceUrl: "https://www.digitalwellnessinstitute.com/research"
  },
  {
    id: '7',
    text: "Усвідомлене використання смартфона – це практика звернення уваги на те, як і чому ви використовуєте телефон, що допомагає зменшити автоматичні дії.",
    category: TIP_CATEGORIES.MENTAL_HEALTH,
    sourceName: "Mindful Technology Use Research",
    sourceUrl: "https://www.mindful.org/how-to-create-a-mindful-tech-practice"
  },
  {
    id: '8',
    text: "Вимкнення push-сповіщень від більшості додатків значно зменшує кількість відволікань та повертає вам контроль над вашим часом.",
    category: TIP_CATEGORIES.PRODUCTIVITY,
    sourceName: "UC Irvine Research",
    sourceUrl: "https://www.ics.uci.edu/~gmark/Home_page/Research.html"
  },
  {
    id: '9',
    text: "Заміна часу, проведеного в соцмережах, на хобі або спілкування в реальному житті позитивно впливає на психічне здоров'я.",
    category: TIP_CATEGORIES.SOCIAL,
    sourceName: "Journal of Social Psychology",
    sourceUrl: "https://www.tandfonline.com/toc/vsoc20/current"
  },
  {
    id: '10',
    text: "Створення 'зон без телефону' у вашому домі (наприклад, спальня, обідній стіл) допомагає зменшити залежність та покращити якість сну та спілкування.",
    category: TIP_CATEGORIES.DIGITAL_DETOX,
    sourceName: "American Academy of Pediatrics",
    sourceUrl: "https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx"
  }
];

// Keys for storage
const LAST_TIP_DATE_KEY = '@last_tip_date';
const CURRENT_TIP_KEY = '@current_tip';
const SHOWN_TIPS_KEY = '@shown_tips';

// Get today's date as a string (YYYY-MM-DD)
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Get random tip that wasn't shown recently
const getRandomTip = () => {
  try {
    // Get shown tips from storage
    const shownTipsJson = tipStorage.getString(SHOWN_TIPS_KEY);
    const shownTips = shownTipsJson ? JSON.parse(shownTipsJson) : [];
    
    // Filter out tips that were shown in the last month
    const availableTips = dailyTips.filter(tip => !shownTips.includes(tip.id));
    
    // If all tips were shown, reset the shown tips list
    if (availableTips.length === 0) {
      tipStorage.set(SHOWN_TIPS_KEY, JSON.stringify([]));
      return dailyTips[Math.floor(Math.random() * dailyTips.length)];
    }
    
    return availableTips[Math.floor(Math.random() * availableTips.length)];
  } catch (error) {
    console.error('Error in getRandomTip:', error);
    return dailyTips[0]; // Return first tip as fallback
  }
};

// Update shown tips list
const updateShownTips = (tip) => {
  try {
    const shownTipsJson = tipStorage.getString(SHOWN_TIPS_KEY);
    const shownTips = shownTipsJson ? JSON.parse(shownTipsJson) : [];
    
    // Add new tip to shown tips
    shownTips.push(tip.id);
    
    // Keep only last month's tips
    if (shownTips.length > dailyTips.length) {
      shownTips.shift(); // Remove oldest tip
    }
    
    tipStorage.set(SHOWN_TIPS_KEY, JSON.stringify(shownTips));
  } catch (error) {
    console.error('Error in updateShownTips:', error);
  }
};

// Get daily tip
export const getDailyTip = () => {
  try {
    const lastTipDate = tipStorage.getString(LAST_TIP_DATE_KEY);
    const todayDate = getTodayDateString();
    
    // If it's a new day or no tip is set
    if (!lastTipDate || lastTipDate !== todayDate) {
      const newTip = getRandomTip();
      
      // Save new tip and date
      console.log('newTip', newTip);
      tipStorage.set(CURRENT_TIP_KEY, JSON.stringify(newTip));
      tipStorage.set(LAST_TIP_DATE_KEY, todayDate);
      updateShownTips(newTip);
      
      return newTip;
    }
    
    // Return current day's tip
    const currentTipJson = tipStorage.getString(CURRENT_TIP_KEY);
    if (!currentTipJson) {
      return dailyTips[0]; // Return first tip as fallback
    }
    
    try {
      console.log('currentTipJson', currentTipJson);
      return JSON.parse(currentTipJson);
    } catch (parseError) {
      console.error('Error parsing current tip:', parseError);
      return dailyTips[0]; // Return first tip as fallback
    }
  } catch (error) {
    console.error('Error in getDailyTip:', error);
    return dailyTips[0]; // Return first tip as fallback
  }
}; 