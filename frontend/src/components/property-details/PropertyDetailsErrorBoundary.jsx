import { Component } from 'react';
import ErrorState from './ErrorState';

/**
 * Catches render-time crashes anywhere below it (e.g. a malformed API
 * response reaching a component that doesn't guard for it) so the user
 * sees the polished error state instead of a blank white screen.
 * Fetch errors are handled separately in PropertyDetails' own `error` state.
 */
class PropertyDetailsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('PropertyDetails crashed:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="This page ran into a problem"
          message="Something unexpected happened while displaying this property. You can try again or head back to search."
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export default PropertyDetailsErrorBoundary;