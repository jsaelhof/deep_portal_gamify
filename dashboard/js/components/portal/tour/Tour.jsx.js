import React from 'react';
import Modal from '../../common/Modal.jsx'
import LocalStorageStore from '../../../store/LocalStorageStore'
import {browserHistory as History} from 'react-router';
import ConfigStore from '../../../store/ConfigStore';
import Constants from '../../shared/Constants';

class Tour extends React.Component {

    constructor ( props ) {
        super( props );

        this.state = {
            show: false,
            tourData: [
                {
                    image: "/dashboard/images/tour/tour1.jpg",
                    title: "DeepMarkit Just Got A Whole Lot Better!",
                    message: "We've added new features and tools that we're sure you're going to love!",
                    button: "start"
                },
                {
                    image: "/dashboard/images/tour/tour3.jpg",
                    title: "Improved Gamified Displays",
                    message: "We’ve updated Gamified Displays with customizable data collection, sweepstake draws and scheduling to make your life easier and your campaigns more effective!",
                    button: "next"
                },
                {
                    image: "/dashboard/images/tour/tour2.jpg",
                    title: "12 Premium Games for Social Media Promotions",
                    message: "Create viral Social Media campaigns using our new games to drive new traffic to your shop.",
                    button: "next"
                },
                {
                    image: "/dashboard/images/tour/tour4.jpg",
                    title: "Email Collection Pop-ups",
                    message: "Use our new Email Collection displays to quickly capture visitors attention, convey important messaging, and reward visitors with prizes in return for their email address.",
                    button: "next"
                },
                // {
                //     image: "/dashboard/images/tour/tour5.jpg",
                //     title: "You and Your Customers Win!",
                //     message: "Run the CASH CLUB 50/50 Sweepstakes on all your campaigns, encouraging increased participation and reward. All paid by DeepMarkit!",
                //     button: "next"
                // },
                {
                    image: "/dashboard/images/tour/tour6.jpg",
                    title: "... And Much More!",
                    message: "We’ve also added additional features to enhance the platform and your marketing campaigns including white-labeling, background images, physical prizes, new themes and more!",
                    button: "done"
                }
            ],
            currentSlide: 0
        }
    }

    componentWillMount () {
        let lastTourVersion = LocalStorageStore.get("tour");

        if (lastTourVersion !== Constants.TOUR_VERSION) {
            this.setState({ show: true });

            // UGLY HACK
            // There's a weird edge case where the user might see both the tour modal AND the legacy campaign warning on slideouts at the same time if they open the app to the legacy slideout editor via a bookmark etc.
            // I dont have any great way of communicating to the other modal that this one is showing so I'm just going to hack in a window var for now and clean it later somehow.
            window.deepmarkitTourShowing = true;
        }
    }

    componentDidUpdate () {
        // If the forceTour prop is true and we aren't showing the tour, reset it and show it.
        if (this.props.forceTour && !this.state.show) {
            this.setState({
                show: true,
                currentSlide: 0
            })
        }
    }

    getButton () {
        switch ( this.state.tourData[this.state.currentSlide].button ) {
            case "start":
                return <button className="btn btn-primary round" onClick={this.onNext.bind(this)}>Start Tour</button>
                break;
            case "next":
                return <button className="btn btn-primary round" onClick={this.onNext.bind(this)}>Next</button>
                break;
            case "done":
                return <div>
                        <button className="btn btn-default round modal-button" onClick={this.onDone.bind(this)}>Done</button>
                        <button className="btn btn-primary round modal-button" onClick={this.onTryItNow.bind(this)}>Try It Now!</button>
                    </div>
                break;
        }
    }

    onNext () {
        this.setState( { currentSlide: this.state.currentSlide + 1 } );
    }

    onDone () {
        LocalStorageStore.set("tour", Constants.TOUR_VERSION);
        this.props.onTourComplete();
        this.setState( { show: false } );
        delete window.deepmarkitTourShowing;
    }

    onTryItNow () {
        LocalStorageStore.set("tour", Constants.TOUR_VERSION);
        this.props.onTourComplete();
        this.setState( { show: false } );
        delete window.deepmarkitTourShowing;
        History.push( ConfigStore.buildRoutePath("create") );
    }

    render () {
        return (
            this.state.show ?
                <Modal show={true} className="sh-modal tour-modal">
                        <div className="tour-banner">
                            <img src={this.state.tourData[this.state.currentSlide].image}/>
                        </div>

                        <div className="tour-content">
                            <div className="tour-title modal-center">
                                {this.state.tourData[this.state.currentSlide].title}
                            </div>

                            <div className="tour-message modal-center">
                                {this.state.tourData[this.state.currentSlide].message}
                            </div>
                        </div>

                        <div className="tour-buttons modal-center">
                            {
                                this.getButton()
                            }
                        </div>
                </Modal>
                :
                null
        );
    }

}

module.exports = Tour;