// src/pages/ChatPage.jsx
import { useTranslation } from 'react-i18next'
import Chatbot from '../components/Chatbot'

export default function ChatPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        <div>
          <h1 className="font-display text-3xl text-slate-800">{t('chatWithUs')}</h1>
          <p className="text-slate-500 text-sm mt-1">Compassionate support — available 24/7</p>
        </div>
        <Chatbot />
      </div>
    </div>
  )
}
