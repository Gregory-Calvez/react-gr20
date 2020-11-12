import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import "react-image-gallery/styles/css/image-gallery.css";

import React, { useState } from 'react'
import { Map, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import Plot from 'react-plotly.js'
import { Tab, Tabs, Card, Table } from 'react-bootstrap';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Carousel from 'react-bootstrap/Carousel'
import Switch from 'react-switch'
import L from 'leaflet'
import LazyLoad from 'react-lazy-load';

import traces from '/home/greg/projects/gr20/src/geotrace_complete_internet.json'
import refuges from '/home/greg/projects/gr20/src/refuges.json'
import images from '/home/greg/projects/gr20/src/images_all.json'
import imagesWithGeo from '/home/greg/projects/gr20/src/images_with_geo.json'


export const pointerIcon = new L.Icon({
    iconUrl: 'icon.png',
    iconRetinaUrl: 'icon.png',
    iconAnchor: [13, 26],
    iconSize: [26, 26],
})

export const cameraIcon = new L.Icon({
    iconUrl: 'camera_icon_3.png',
    iconRetinaUrl: 'camera_icon_3.png',
    iconSize: [16, 16],
})

export const homeIcon = new L.Icon({
    iconUrl: 'home_icon_2.png',
    iconRetinaUrl: 'home_icon_2.png',
    iconSize: [21, 21],
})

export const blueIcon = new L.Icon({
    iconUrl: 'blue_marker.png',
    iconRetinaUrl: 'blue_marker.png',
    iconAnchor: [10, 20],
    iconSize: [20, 20],
})

export const greenIcon = new L.Icon({
    iconUrl: 'green_marker.png',
    iconRetinaUrl: 'green_marker.png',
    iconAnchor: [10, 20],
    iconSize: [20, 20],
})

function RefugeMarker(props) {
    return (
        <Marker
            position={[props.refuge.lat, props.refuge.lon]}
            icon={homeIcon}
        />
    )
}

function RefugesMap(props) {
    if (props.display) {
        return (
            <div>
                {
                    Array.from(refuges).map(
                        (refuge) => <RefugeMarker refuge={refuge}/>
                    )
                }
            </div>
        )
    }
    return (<div></div>)
}

function ImageMarker(props) {
    return (
        <Marker
            position={[props.image.lat, props.image.lon]}
            icon={greenIcon}
        />
    )
}

function CurrentImageMarker(props) {
    return (
        <Marker
            position={[props.image.lat, props.image.lon]}
            icon={cameraIcon}
        />
    )
}

function ImagesMap(props) {
    if (props.display) {
        return (
            <div>
                {
                    Array.from(imagesWithGeo).map(
                        (im) => <ImageMarker image={im}/>
                    )
                }
            </div>
        )
    }
    return (<div></div>)
}

function CurrentImageMap(props) {
    if (props.display) {
        let im = images[props.imageId];
        if (im.isok) {
            return (
                <div><CurrentImageMarker image={im}/></div>
            )
        }
        else {
            return (<div></div>)
        }
    }
    return (<div></div>)
}

function geoDistance(lat1, lon1, lat2, lon2) {
    // source: https://www.geodatasource.com/developers/javascript
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    } else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) *
            Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344 // Kilometers?
        return dist;
    }
}

function normalDistance(lat1, lon1, lat2, lon2) {
    return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
}

function project(lat, lng, trace) {
    let distances = Array.from(trace).map(
        (point) => normalDistance(lat, lng, point.lat, point.lon)
    );
    let i = distances.indexOf(Math.min(...distances));
    return Array.from(trace)[i];
};

function getProjectId(lat, lng, trace) {
    let distances = Array.from(trace).map(
        (point) => normalDistance(lat, lng, point.lat, point.lon)
    );
    let i = distances.indexOf(Math.min(...distances));
    return i;
};

function getImageDist(lat, lng, im) {
    if (im.isok) {
        return normalDistance(lat, lng, im.lat, im.lon);
    }
    else {
        return 1000000;  // too high
    }
};

function getProjectImage(lat, lng) {
    let distances = Array.from(images).map(
        (im) => getImageDist(lat, lng, im)
    );
    let i = distances.indexOf(Math.min(...distances));
    return i;
};

function LMap(props) {
    let trace = traces[props.traceId]['trace'];
    let projected = trace[props.projectId];
    return (
        <Map
            viewport={props.viewport}
            onClick={(e) => props.onClickMap(e)}
        >
            <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url='https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=ScGkd9ncWIEGV71qyhCe'
            />
            <Polyline
                positions={trace}
            />
            <Marker
                position={[projected.lat, projected.lon]}
                icon={pointerIcon}
            />
            <ImagesMap display={props.imagesOnMap}/>
            <CurrentImageMap display={props.currentImagesOnMap} imageId={props.imageId}/>
            <RefugesMap display={props.refugesOnMap}/>
        </Map>
    )
};
//            <Marker
//                position={props.viewport.center}
//                icon={pointerIcon}
//            />

function PlotElevation(props) {
    let trace = traces[props.traceId]['trace'];
    let projected = trace[props.projectId];
    return (
        <Plot
            style={{'width': '100%'}}
            data={
                [
                    {
                        x: trace.map(point => point.cum_distance),
                        y: trace.map(point => point.ele),
                        type: 'scatter',
                        mode: 'lines',
                        marker: {color: 'blue'},
                        hovertemplate: '<b>Elevation:</b> %{y:.0f}m<br><b>Distance:</b> %{x:.0f}km<extra></extra>',
                        showlegend: false,
                    },
                    {
                        x: [projected.cum_distance],
                        y: [projected.ele],
                        type: 'scatter',
                        mode: 'marker',
                        marker: {color: 'red', symbol: 'cross', size: 10},
                        showlegend: false,
                    },
                ]
            }
            layout={
                {
                    hovermode: 'closest',
                    height: 300,
                    showlegend: false,
                    xaxis: {'title': 'Distance (km)'},
                    yaxis: {'title': 'Elevation (m)', 'range': [0, 2800]},
                }
            }
            onClick={(e) => {props.onClickPlot(e)}}
        />
    )
};

function RTabs(props) {
    return (
        <Tabs defaultActiveKey="images" id="uncontrolled-tab-example">
            <Tab eventKey="traces" title="Traces GPS">
                <Traces onClickTrace={props.onClickTrace}/>
            </Tab>
            <Tab eventKey="refuges" title="Refuges">
                <Refuges
                    refugesOnMapToggle={props.refugesOnMapToggle}
                    refugesOnMap={props.refugesOnMap}
                    onClickRefuge={props.onClickRefuge}
                />
            </Tab>
            <Tab eventKey="images" title="Images">
                <Images
                    imagesOnMapToggle={props.imagesOnMapToggle}
                    imagesOnMap={props.imagesOnMap}
                    currentImagesOnMapToggle={props.currentImagesOnMapToggle}
                    currentImagesOnMap={props.currentImagesOnMap}
                    imageId={props.imageId}
                    onChangeImage={props.onChangeImage}
                />
            </Tab>
        </Tabs>
    )
}
function TraceMap() {
    let [refugesOnMap, setRefugesOnMap] = useState(true);
    let [imagesOnMap, setImagesOnMap] = useState(false);
    let [currentImagesOnMap, setCurrentImagesOnMap] = useState(true);
    let [traceId, setTraceId] = useState(0);
    let [viewport, setViewport] = useState({center: [42.46, 8.906], zoom: 10})
    // let [myZoom, setMyZoom] = useState(10);
    // let [myPosition, setMyPosition] = useState({lat: 42.46, lng: 8.906});
    let [projectId, setProjectId] = useState(0);
    let [imageId, setImageId] = useState(0);
    let [index, setIndex] = useState(60);
    let trace = traces[traceId]['trace'];
    function changeImage(selectedIndex, e) {
        setImageId(selectedIndex);
        if (images[selectedIndex].isok) {
            let imgLat = images[selectedIndex].lat;
            let imgLon = images[selectedIndex].lon;
            let newProjectId = getProjectId(imgLat, imgLon, trace)
            setProjectId(newProjectId);
            // setMyPosition({lat: imgLat, lng: imgLon});
            setViewport({center: [imgLat, imgLon]});
        };
    };
    function clickRefuge(refugeId) {
        let refugeLat = refuges[refugeId].lat;
        let refugeLon = refuges[refugeId].lon;
        let newProjectId = getProjectId(refugeLat, refugeLon, trace);
        let newImageId = getProjectImage(refugeLat, refugeLon)
        setProjectId(newProjectId);
        setImageId(newImageId);
        setViewport({center: [refugeLat, refugeLon]});
        // setMyPosition({lat: refugeLat, lng: refugeLon});
    };
    function refugesOnMapToggle(checked) {
        setRefugesOnMap(checked);
    }
    function imagesOnMapToggle(checked) {
        setImagesOnMap(checked);
    }
    function currentImagesOnMapToggle(checked) {
        setCurrentImagesOnMap(checked);
    }
    function clickTrace(id) {
        setTraceId(id);
        let trace = traces[id]['trace'];
        let newProjectId = getProjectId(viewport.center[0], viewport.center[1], trace)
        setProjectId(newProjectId);
    };
    function clickMap(e) {
        let newProjectId = getProjectId(e.latlng.lat, e.latlng.lng, trace)
        let newImageId = getProjectImage(e.latlng.lat, e.latlng.lng)
        setViewport({center: [e.latlng.lat, e.latlng.lng]});
        setProjectId(newProjectId);
        setImageId(newImageId);
    };
    function clickPlot(e) {
        let newProjectId = e.points[0].pointIndex
        let newImageId = getProjectImage(trace[newProjectId].lat, trace[newProjectId].lon)
        setViewport({center: [trace[newProjectId].lat, trace[newProjectId].lon]});
        setProjectId(newProjectId);
        setImageId(newImageId);
    };
    return (
        <div>
            <div style={{'width': '50%', 'display': 'inline-block', 'vertical-align': 'top'}}>
                <Card body>
                    <div style={{height: '400px'}}>
                        <LMap
                            viewport={viewport}
                            traceId={traceId}
                            projectId={projectId}
                            onClickMap={clickMap}
                            imagesOnMap={imagesOnMap}
                            currentImagesOnMap={currentImagesOnMap}
                            imageId={imageId}
                            refugesOnMap={refugesOnMap}
                        />
                    </div>
                    <div>
                        <PlotElevation
                            traceId={traceId}
                            projectId={projectId}
                            onClickPlot={clickPlot}
                        />
                    </div>
                </Card>
            </div>
            <div style={{'width': '50%', 'display': 'inline-block', 'vertical-align': 'top'}}>
                <Card body>
                    <RTabs
                        onClickTrace={clickTrace}
                        refugesOnMapToggle={refugesOnMapToggle}
                        refugesOnMap={refugesOnMap}
                        onClickRefuge={clickRefuge}
                        imagesOnMapToggle={imagesOnMapToggle}
                        currentImagesOnMapToggle={currentImagesOnMapToggle}
                        imagesOnMap={imagesOnMap}
                        currentImagesOnMap={currentImagesOnMap}
                        imageId={imageId}
                        onChangeImage={changeImage}
                    />
                </Card>
            </div>
        </div>
    )
};

function GR20NavBar() {
    return (
        <Navbar bg="light">
            <Navbar.Brand href="#home">
                <img
                    src="logo_gr20.png"
                    width="50"
                    height="30"
                    />
                <span>
                </span>
                GR20
            </Navbar.Brand>
        </Navbar>
    )
};

function ImageDetails(props) {
    const setCoordinate = (e) => {
        console.log('TODO');
    };
    let details = images[props.imageId];
    return (
        <div>
            <h5> Details Photo </h5>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        Object.keys(details).map((key, index) => (
                            <tr>
                                <td>{key}</td>
                                <td>{JSON.stringify(details[key])}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </Table>
        </div>
    )
}
// TODO: Set Coordinates on an image
//            <Button onClick={e => setCoordinate(e)}>
//                Set Current Coordinates for photo
//            </Button>
function Images(props) {
    return (
        <div style={{marginTop: 40, marginLeft: 10, marginRight: 10}}>
            <div>
                <Switch
                    onChange={props.imagesOnMapToggle}
                    checked={props.imagesOnMap}
                    className="react-switch"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={15}
                    width={28}
                />
                <span>Show geoloc'd images on map</span>
                <br/>
                <Switch
                    onChange={props.currentImagesOnMapToggle}
                    checked={props.currentImagesOnMap}
                    className="react-switch"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={15}
                    width={28}
                />
                <span>Show current image on map (if geoloc'd)</span>
            </div>
            <Carousel
                activeIndex={props.imageId}
                onSelect={(selectedIndex, e) => props.onChangeImage(selectedIndex, e)}
                interval={null}
            >
                {Array.from(images).map(
                    (im) => (
                        <Carousel.Item>
                            <LazyLoad height={762} offsetVertical={300}>
                                <img className="d-block w-100" src={im.path}/>
                            </LazyLoad>
                        </Carousel.Item>
                    )
                )}
            </Carousel>
            <ImageDetails imageId={props.imageId}/>
        </div>
    )
};

function Traces(props) {
    return (
        <div style={{marginTop: 40, marginLeft: 10, marginRight: 10}}>
            <ButtonGroup vertical>
                {
                    Array.from(traces).map(
                        (trace) => <Button variant="outline-secondary" size="sm" onClick={(e) => props.onClickTrace(trace.index_trace)}>{trace.name}</Button>
                    )
                }
            </ButtonGroup>
        </div>
    )
};

function Refuges(props) {
    return (
        <div style={{marginTop: 40, marginLeft: 10, marginRight: 10}}>
            <div>
                <Switch
                    onChange={props.refugesOnMapToggle}
                    checked={props.refugesOnMap}
                    className="react-switch"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={15}
                    width={28}
                />
                <span>Show refuges on map</span>
            </div>
            <ButtonGroup vertical>
                {
                    Array.from(refuges).map(
                        (refuge) => (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={(e) => props.onClickRefuge(refuge.index_refuge)}
                            >
                                {refuge.name}
                            </Button>
                        )
                    )
                }
            </ButtonGroup>
        </div>
    )
};

function App() {
    return (
        <div style={{marginLeft: 10, marginRight: 10}}>
            <GR20NavBar/>
            <TraceMap/>
        </div>
    )
};

export default App;
