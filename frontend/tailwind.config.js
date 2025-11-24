import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sidebar: {
                    DEFAULT: '#1e1e1e',
                    hover: '#2d2d2d',
                    active: '#333333',
                    border: '#333333',
                    text: '#e5e7eb',
                    muted: '#9ca3af'
                },
                primary: {
                    DEFAULT: '#000000',
                    hover: '#333333',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [
        typography,
    ],
}
