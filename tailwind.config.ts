import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/app/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			// На мобильной отступ только от main; на md+ — привычные 2rem
			padding: {
				DEFAULT: '0',
				md: '2rem',
			},
			screens: {
				'2xl': '100%'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				'header-bg': 'var(--header-bg)',
				'header-foreground': 'var(--header-foreground)',
				'header-foreground-secondary': 'var(--header-foreground-secondary)',
				'color-text-main': 'var(--color-text-main)',
				'color-text-secondary': 'var(--color-text-secondary)',
				'color-bg-main': 'var(--color-bg-main)',
				'accent-btn': {
					DEFAULT: 'var(--color-accent-btn)',
					hover: 'var(--color-accent-btn-hover)',
					active: 'var(--color-accent-btn-active)',
					'disabled-bg': 'var(--color-accent-btn-disabled-bg)',
					'disabled-text': 'var(--color-accent-btn-disabled-text)',
				},
				'outline-btn': {
					border: 'var(--color-outline-border)',
					'hover-bg': 'var(--color-outline-hover-bg)',
					'active-bg': 'var(--color-outline-active-bg)',
				},
				'btn-chip-active': 'var(--btn-chip-active-bg)',
				'border-block': {
					DEFAULT: 'var(--color-border-block)',
					hover: 'var(--color-border-block-hover)',
				},
				'badge': {
					bg: 'var(--color-badge-bg)',
					text: 'var(--color-badge-text)',
				},
				ticker: {
					bg: 'var(--ticker-bg)',
					foreground: 'var(--ticker-foreground)'
				},
				'page-bg': 'var(--page-bg)',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					soft: 'hsl(var(--primary-soft))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				nature: {
					green: 'hsl(var(--nature-green))',
					pink: 'hsl(var(--nature-pink))',
					coral: 'hsl(var(--nature-coral))',
					lavender: 'hsl(var(--nature-lavender))',
					mint: 'hsl(var(--nature-mint))'
				},
				hero: {
					green: 'hsl(var(--hero-green))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'elegant': 'var(--shadow-elegant)',
				'glow': 'var(--shadow-glow)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'spring': 'var(--transition-spring)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'ping-slow': {
					'0%': {
						transform: 'scale(1)',
						opacity: '1'
					},
					'75%, 100%': {
						transform: 'scale(1.5)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
			},
			fontFamily: {
				montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
			}
		}
	},
	plugins: [],
} satisfies Config;
