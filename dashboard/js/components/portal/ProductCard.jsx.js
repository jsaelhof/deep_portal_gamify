import React from 'react';

class ProductCard extends React.Component {

    constructor ( props ) {
        super( props );
    }

    onClick () {
        if (this.props.onClick) this.props.onClick();
    }

    render () {
        return (
            <div className="product-card" onClick={this.onClick.bind(this)}>
                <img className="product-card-shadow" src="/dashboard/images/create/bottomshadow.png"/>
                <div className="product-card-main">
                    <img src={this.props.mainImage}/>
                    <img className="product-card-label" src={this.props.labelImage}/>
                    <img src="/dashboard/images/create/divider.png"/>
                    <div className="product-card-content">
                        {
                            this.props.bullets.map( (bullet, index) => {
                                return <div key={"bullet"+index}>{bullet}</div>
                            } )
                        }
                    </div>

                    { this.props.comingSoon ?
                        <div className="coming-soon">Coming Soon!</div>
                        :
                        <button className="btn btn-primary round product-card-button">{ this.props.buttonLabel }</button>
                    }
                    { this.props.comingSoon ? <div className="ribbon"><span className="ribbon-red">Coming Soon!</span></div> : null }
                    { this.props.new ? <div className="ribbon"><span className="ribbon-green">New!</span></div> : null }
                    { this.props.premium ? <div className="ribbon"><span className="ribbon-gold">Premium</span></div> : null }
                    { this.props.free ? <div className="ribbon"><span className="ribbon-green">FREE</span></div> : null }
                </div>
            </div>
        );
    }

}

module.exports = ProductCard;