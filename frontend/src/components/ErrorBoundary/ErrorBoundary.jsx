import { Component } from 'react'
import Error from '../Error/Error'

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
        <div className="error-boundary">
          <Error message="Something went wrong while loading this page." onRetry={this.handleReset} />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
