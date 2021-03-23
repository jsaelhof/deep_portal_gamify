import React from 'react';
import i18n from '../../store/i18nStore';

class SaveStatus extends React.Component {
    constructor( props ) {
        super( props );

        this.state = {
            show: this.props.show
        }

        this.timeout;
    }

    // If hte user leaves the editor before the delay for the save state timeout expires, we need to kill it immediately.
    componentWillUnmount () {
        clearTimeout(this.timeout);
        this.setState( { show: false } );
    }

    componentWillReceiveProps ( newProps ) {
        if (newProps.show !== this.state.show) {
            clearTimeout(this.timeout);
            if (this.props.saved && newProps.show) {
                this.timeout = setTimeout( () => {
                    this.setState( { show: false } );
                }, 5000 );
            }
        }

        this.setState( { show: newProps.show } );
    }

    render() {
        // Status can be set to undefined to mean "just loaded, saved but don't show a status update"
        if (this.props.saved === undefined) return null;

        let styleBase = {
            position: "fixed",
            right: 0,
            backgroundColor: "rgba(255,255,255,0.8)",
            zIndex: 1000,
            padding: "5px 10px",
            fontSize: "14px",
            borderBottomLeftRadius: "5px",
            color: "#fff"
        }

        let styleSaved = {
            backgroundColor: "rgba(72,137,69,0.8)",
            borderBottom: "thin solid rgb(93,137,92)",
            borderLeft: "thin solid rgb(93,137,92)",
        }

        let styleDirty = {
            fontSize: "12px",
            backgroundColor: "rgba(203,67,67,0.8)",
            //backgroundColor: "rgba(220,142,40,0.8)",
            borderBottom: "thin solid rgb(161,53,53)",
            //borderBottom: "thin solid rgb(175,115,30)",
            borderLeft: "thin solid rgb(161,53,53)",
            //borderLeft: "thin solid rgb(175,115,30)",
        }

        let styleSlideIn = {
            top: 0,
            transition: "top 0.5s ease-out 0.75s"
        }

        let styleSlideOut = {
            top: "-30px",
            transition: "top 0.5s ease-out"
        }

        let stylePosition = this.state.show ? styleSlideIn : styleSlideOut;

        // Figure out which state to render.
        if (this.props.saved) {
            return (
                <div style={{...styleBase, ...styleSaved, ...stylePosition}}>
                    <div>{i18n.stringFor('sh_label_saved')}</div>
                </div>
            )
        } else {
            return (
                <div style={{...styleBase, ...styleDirty, ...stylePosition}}>
                    <div>{i18n.stringFor('sh_label_unsaved')}</div>
                </div>
            )
        }
    }
}

export default SaveStatus;