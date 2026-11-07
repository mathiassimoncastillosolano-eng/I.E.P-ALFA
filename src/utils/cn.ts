import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cx = (...v: ClassValue[]) => twMerge(clsx(v))
