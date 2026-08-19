import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { checkSymptoms, getFAQs, getHealthTips } from '../../api/assistant'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errorHandler'
import getImageUrl from '../../utils/imageUrl'
import './Assistant.css'

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Sore Throat',
  'Runny Nose',
  'Fatigue',
  'Body Ache',
  'Chest Pain',
  'Shortness of Breath',
  'Stomach Pain',
  'Nausea',
  'Diarrhea',
  'Back Pain',
  'Joint Pain',
  'Skin Rash',
  'Dizziness',
  'Ear Pain',
  'Anxiety',
]

const SEVERITY_STYLES = {
  low: { label: 'Low', className: 'sev-low' },
  medium: { label: 'Medium', className: 'sev-medium' },
  high: { label: 'High', className: 'sev-high' },
  urgent: { label: 'Urgent', className: 'sev-urgent' },
}

const TABS = [
  { key: 'symptom', label: '🩺 Symptom Checker' },
  { key: 'faq', label: '❓ FAQs' },
  { key: 'tips', label: '💡 Health Tips' },
]

const DoctorCard = ({ doctor }) => (
  <div className="ai-doctor-card">
    <img
      src={getImageUrl(doctor.image) || 'https://via.placeholder.com/56?text=D'}
      alt={doctor.name}
      className="ai-doctor-img"
    />
    <div className="ai-doctor-info">
      <h4>{doctor.name}</h4>
      <p className="ai-doctor-spec">{doctor.specialization}</p>
      <p className="ai-doctor-fee">Rs. {doctor.fees}</p>
    </div>
    <Link to={`/book-appointment/${doctor._id}`} className="ai-book-btn">
      Book
    </Link>
  </div>
)

const Assistant = () => {
  const { notify, toastEl } = useToast()
  const [activeTab, setActiveTab] = useState('symptom')

  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [checkError, setCheckError] = useState('')

  const [faqs, setFaqs] = useState([])
  const [faqSearch, setFaqSearch] = useState('')
  const [faqLoading, setFaqLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)

  const [tips, setTips] = useState([])
  const [tipsLoading, setTipsLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'faq' && faqs.length === 0) {
      setFaqLoading(true)
      getFAQs()
        .then(setFaqs)
        .catch(() => setFaqs([]))
        .finally(() => setFaqLoading(false))
    }
  }, [activeTab, faqs.length])

  useEffect(() => {
    if (activeTab === 'tips' && tips.length === 0) {
      loadTips()
    }
  }, [activeTab])

  const loadTips = async () => {
    setTipsLoading(true)
    try {
      setTips(await getHealthTips())
    } catch {
      setTips([])
    } finally {
      setTipsLoading(false)
    }
  }

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    )
    setResult(null)
    setCheckError('')
  }

  const addCustomSymptom = () => {
    const value = customSymptom.trim()
    if (!value) return
    setSelectedSymptoms((prev) =>
      prev.includes(value) ? prev : [...prev, value]
    )
    setCustomSymptom('')
    setResult(null)
    setCheckError('')
  }

  const runCheck = async () => {
    if (selectedSymptoms.length === 0) {
      setCheckError('Please select or add at least one symptom.')
      return
    }
    setChecking(true)
    setCheckError('')
    try {
      const res = await checkSymptoms(selectedSymptoms)
      setResult(res)
    } catch (err) {
      setCheckError(getErrorMessage(err, 'Could not run the symptom check.'))
    } finally {
      setChecking(false)
    }
  }

  const filteredFaqs = faqs.filter((f) => {
    const q = faqSearch.trim().toLowerCase()
    if (!q) return true
    return `${f.question} ${f.answer}`.toLowerCase().includes(q)
  })

  return (
    <div className="ai-page">
      {toastEl}
      <div className="ai-container">
        <div className="ai-header">
          <div className="ai-header-badge">🤖</div>
          <div>
            <h1>AI Health Assistant</h1>
            <p>Check symptoms, find the right specialist, and get smart health guidance.</p>
          </div>
        </div>

        <div className="ai-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ai-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'symptom' && (
          <div className="ai-symptom-checker">
            <div className="ai-card">
              <h2>Symptom Checker</h2>
              <p className="ai-card-sub">
                Select the symptoms you are experiencing. The assistant will match them against common
                conditions and suggest the right specialist.
              </p>

              <div className="ai-chip-grid">
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    className={`ai-chip ${selectedSymptoms.includes(s) ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="ai-custom-input">
                <input
                  type="text"
                  placeholder="Add another symptom (e.g. back pain)"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomSymptom()
                    }
                  }}
                />
                <button type="button" onClick={addCustomSymptom} className="ai-add-btn">
                  Add
                </button>
              </div>

              {selectedSymptoms.length > 0 && (
                <div className="ai-selected-symptoms">
                  <span className="ai-selected-label">Selected:</span>
                  {selectedSymptoms.map((s) => (
                    <span key={s} className="ai-selected-tag">
                      {s}
                      <button type="button" onClick={() => toggleSymptom(s)} aria-label={`Remove ${s}`}>
                        ×
                      </button>
                    </span>
                  ))}
                  <button type="button" className="ai-clear-btn" onClick={() => setSelectedSymptoms([])}>
                    Clear all
                  </button>
                </div>
              )}

              {checkError && <div className="ai-error">{checkError}</div>}

              <button className="ai-check-btn" onClick={runCheck} disabled={checking || selectedSymptoms.length === 0}>
                {checking ? 'Checking symptoms...' : 'Check Symptoms'}
              </button>
            </div>

            {result && (
              <div className="ai-results">
                <div className={`ai-severity-banner ${SEVERITY_STYLES[result.severity]?.className || 'sev-low'}`}>
                  <div className="ai-severity-title">
                    <span className={`ai-severity-badge ${SEVERITY_STYLES[result.severity]?.className || ''}`}>
                      {SEVERITY_STYLES[result.severity]?.label || result.severity}
                    </span>
                    <span>{result.urgency}</span>
                  </div>
                  <p>{result.summaryText}</p>
                  {result.severity === 'urgent' && (
                    <p className="ai-urgent-note">⚠️ Please seek emergency medical care right away.</p>
                  )}
                </div>

                <div className="ai-section-title">Possible conditions</div>
                <div className="ai-conditions">
                  {result.conditions.map((c) => (
                    <div className="ai-condition-card" key={c.id}>
                      <div className="ai-condition-head">
                        <h3>{c.name}</h3>
                        <span className={`ai-condition-badge ${SEVERITY_STYLES[c.severity]?.className || ''}`}>
                          {SEVERITY_STYLES[c.severity]?.label || c.severity}
                        </span>
                      </div>
                      <p className="ai-condition-spec">
                        Recommended: {c.specialist}
                      </p>
                      <p className="ai-condition-advice">{c.advice}</p>
                      <p className="ai-condition-keywords">
                        Matched: {c.matchedKeywords.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="ai-section-title">Smart appointment suggestion</div>
                <div className="ai-suggestion-card">
                  <p>{result.suggestion || result.suggestion}</p>
                  {result.specialist && (
                    <Link to={`/doctors?specialization=${encodeURIComponent(result.specialist)}`} className="ai-suggest-btn">
                      Find {result.specialist}
                    </Link>
                  )}
                </div>

                {result.doctors && result.doctors.length > 0 && (
                  <>
                    <div className="ai-section-title">Recommended doctors</div>
                    <div className="ai-doctors">
                      {result.doctors.map((doctor) => (
                        <DoctorCard key={doctor._id} doctor={doctor} />
                      ))}
                    </div>
                  </>
                )}

                <p className="ai-disclaimer">{result.disclaimer}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="ai-faqs">
            <div className="ai-card">
              <h2>Frequently Asked Questions</h2>
              <input
                type="text"
                className="ai-faq-search"
                placeholder="Search questions (e.g. reschedule, refund, video)"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
              />
            </div>

            {faqLoading ? (
              <div className="ai-loading">Loading FAQs...</div>
            ) : filteredFaqs.length === 0 ? (
              <div className="ai-empty">No questions found.</div>
            ) : (
              <div className="ai-faq-list">
                {filteredFaqs.map((faq) => (
                  <div className="ai-faq-item" key={faq.id}>
                    <button
                      className="ai-faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    >
                      <span>{faq.question}</span>
                      <span className="ai-faq-caret">{expandedFaq === faq.id ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === faq.id && <div className="ai-faq-answer">{faq.answer}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="ai-tips">
            <div className="ai-tips-header">
              <h2>Daily Health Tips</h2>
              <button className="ai-shuffle-btn" onClick={loadTips} disabled={tipsLoading}>
                {tipsLoading ? 'Loading...' : '🔄 Shuffle Tips'}
              </button>
            </div>
            {tipsLoading ? (
              <div className="ai-loading">Loading tips...</div>
            ) : (
              <div className="ai-tips-grid">
                {tips.map((tip) => (
                  <div className="ai-tip-card" key={tip.id}>
                    <span className="ai-tip-category">{tip.category}</span>
                    <h3>{tip.title}</h3>
                    <p>{tip.tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Assistant
