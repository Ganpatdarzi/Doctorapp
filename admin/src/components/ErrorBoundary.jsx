import { Component } from 'react'
import { ErrorBanner } from './DoctorUI'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-page-pad" style={{ padding: '2rem' }}>
          <ErrorBanner message="Something went wrong while loading this page." />
          <button className="d-btn" onClick={this.handleReset} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
