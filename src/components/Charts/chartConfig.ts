import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
)

ChartJS.defaults.font.family = "'Poppins', system-ui, sans-serif"
ChartJS.defaults.backgroundColor = 'transparent'

export function updateChartTheme(): void {
  if (typeof document === 'undefined') return

  const muted =
    getComputedStyle(document.documentElement).getPropertyValue('--color-muted').trim() || '#6b7280'
  ChartJS.defaults.color = muted
}

updateChartTheme()

export { ChartJS }
