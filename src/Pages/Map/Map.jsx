//CSV
import Papa from 'papaparse'
// import data from '../../Assets/Data/CebuSouthLandmarks.csv'
// import data from '../../Assets/Data/brgy-lahug-landmarks.csv'
import data from '../../Assets/Data/cebu-landmarks-minimal.csv'

import "./Map.css"
import {MapContainer, Marker, Popup, GeoJSON, Polyline, useMap, FeatureGroup} from "react-leaflet"
import {CebuMap} from "../../Assets/CebuMap"
import {CebuRoads} from "../../Assets/CebuRoadsV2.js"
import SideBar from "../../Components/Navbar/Sidebar"
import { EditControl } from 'react-leaflet-draw';
import "leaflet-draw/dist/leaflet.draw.css"
import "leaflet/dist/leaflet.css"

import MarkerLayer from "../../Components/Markers/Markers"
import L, { latLng } from "leaflet"

import { Navigate, useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react"

import EditMap from "../EditMap/EditMap"
import Search from "../Search/Search"
import PathFinder from "../PathFinder/PathFinder"
import UpdateTraffic from "../UpdateTraffic/UpdateTraffic"

import "leaflet-snap/leaflet.snap"
import "leaflet-geometryutil"

import '@geoman-io/leaflet-geoman-free';  
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';  

import {CreateNodes, GetNodes} from "../../ApiCalls/NodeAPI"
import { MoveDownSharp } from '@mui/icons-material'
import {AddLandmarkFn, EditLandmarkFn, RemoveLandmarkFn} from './EditLandmarksFn'
import AddLandmarksSidebar from '../EditMap/AddLandmarksSidebar'
import { AddRoads } from './AddRoads'
import { intersectionsRaw } from '../../Assets/Data/intersectionsRaw'
import {landmarksRaw} from '../../Assets/Data/landmarksRaw'
import { edges } from '../../Assets/Data/edges'
import { GetRoads } from '../../ApiCalls/RoadsAPI'
import { locationChecker } from '../../Components/Markers/Markers'

import Select, { components } from 'react-select'
import { landmarkAll } from '../../Assets/Data/landmarktype-data.js'
import { locationsAll } from '../../Assets/Data/location-data.js'

const Map = ({ children }) => {
  const location = useLocation()
  const subpage = location.hash  
  const [intersections, setIntersections] = useState([])
  const [landmarks, setLandmarks] = useState([])
  const [roads, setRoads] = useState([])
  const [currRoad, setCurrRoad] = useState(null)
  const [currNode, setCurrNode] = useState(null)
  const [isClicked, setIsClicked] = useState(false)
  const [editData, setEditData] = useState([])
  const [tempData, setTempData] = useState()
  const [editedNodes, setEditedNodes] = useState({created:[], deleted:[], edited:[]})
  const [editedEdges, setEditedEdges] = useState({created:[], deleted:[], edited:[]})
  const [allNodes, setAllNodes] = useState([])


  // show path
  const [path, setPath] = useState([]);

  const HandleSubpage = () => {
    if (subpage === "#editmap")
      return(<EditMap/>)
    else if (subpage === "#search")
      return(<Search/>)
    else if (subpage === "#pathfinder")
      return(<PathFinder setPath={setPath}/>)
    else if (subpage === "#updatetraffic")
      return(<UpdateTraffic/>)
    else if (subpage === "#addlandmark" || subpage === "#addlandmark?adding")
      return(<AddLandmarksSidebar editData={editData  } />)
  }

  console.log(path)

  // UNCOMMENT IF SERVER IS UP
  // const FetchNodes = () => {
  //   useEffect(() => {
  //     GetNodes()
  //       .then((response) => {
  //         console.log(response.data.data)
  //         setLandmarks(response.data.data.nodes)
  //         setIntersections(response.data.data.intersections)
  //       });

  //     GetRoads().then((response)=>{
  //       console.log(response)
  //       setRoads(response.data.data.edges)
  //     })
    
  //   }, []);
  // };
  // FetchNodes()
  
  
  // UNCOMMENT IF SERVER IS DOWN
  useEffect(()=>{
    setLandmarks(landmarksRaw)
    setIntersections(intersectionsRaw)
    setRoads(edges)
  },[])


  useEffect(() => {
    setAllNodes(landmarks.concat(intersections))
  },[landmarks, intersections]);
  
  async function createNodes(node){  
    const response = await CreateNodes([node])

    console.log(response)
    if (response.data.status !== 201){
      console.log("FAILED")
    } else {
      console.log("SUCCESS")
    }

  }

  const MapMarkerId = () =>{
    let map = useMap()

    useEffect(()=>{
      if(landmarks.length > 0){
        map.eachLayer((layer) => {
          if(layer._latlng){
            let index = landmarks?.findIndex(({latitude,longitude}) => layer._latlng.lat==latitude && layer._latlng.lng==longitude)
            if (index != -1){
              landmarks[index]["leaflet_id"] = layer._leaflet_id
            } else { 
              index = intersections?.findIndex(({latitude,longitude}) => layer._latlng.lat==latitude && layer._latlng.lng==longitude)
              if (intersections != -1) {
                intersections["leaflet_id"] = layer._leaflet_id
              } 
              // else {
              //   index = roads?.findIndex(({latitude,longitude}) => layer._latlng.lat==latitude && layer._latlng.lng==longitude)
              //   if (roads != -1){
              //     roads["leaflet_id"] = layer._leaflet_id
              //   }
              // }
            } 
          }
        })
      }

    },[landmarks,intersections,roads])
  }
      console.log(landmarks,intersections)
      console.log(editData)

  const nameIn = useRef(null)
  const typeIn = useRef(null)
  const locationIn = useRef(null)

  async function handleEditChange (data) {
    data.name = nameIn.current.value
    data.location = locationIn.current.value
    data.landmark_type = typeIn.current.value

    console.log([data])
    
    const response = await CreateNodes([data])

    // console.log(response)
    // if (response.data.status !== 201){
    //   console.log("FAILED")
    // } else {
    //   console.log("SUCCESS")
    // }

    
    // const {name, value, id} = e.target

    // if(tempData?.id == id){

    //   setTempData((prev) => ({...prev, name:value}))

    // } else {
    //   setTempData({
    //     id: id,
    //     name: value
    //   })
    // }

    // console.log(tempData)
    
  }

  console.log(editData)

  const HandleMode = () => {
    const map = useMap()
    // map.pm.addControls({  
    //   position: 'topright',  
    //   // drawCircle: false,  
    // });  

    map.closePopupOnClick = false

    
    if(subpage==="#addlandmark?adding"){
      AddLandmarkFn(setCurrNode, editData)
      return(
        <div> 
          <Navigate to={"#addlandmark"}/>
          {editData?.map((data)=>(
          <Marker 
            key={data.leaflet_id}
            position={[data.latitude, data.longitude]} 
            icon={locationChecker(data.landmark_type)}
          >
            <Popup>
              hellow
            </Popup>
          </Marker>))}
        </div>
      )
    } 
    
    else if(subpage==="#addlandmark"){

      return(
        <div>
          {editData?.map((data, index)=>(
          
          <FeatureGroup >
            <Popup maxWidth={200} keepInView={true} interactive={true} closePopupOnClick={true} closeOnEscapeKey={false} autoClose={false} closeOnClick={false}>
              <label>Name</label>
              <input id={data.leaflet_id} ref={nameIn} name='name' autoComplete="off"/>
              <label>Type of Landmark</label>
              {/* <input id={data.leaflet_id} name='landmark_type' autoComplete='off' onChange={e => handleEditChange(e)}/> */}
							<Select
								className='landmark_type'
								options={landmarkAll.landmark.map(({label, value})=>({label, value}) )}
								onChange={e => handleEditChange(e)}
							/>
              <label>Location</label>
              {/* <input id={data.leaflet_id} name='location' autoComplete='off' onChange={e => handleEditChange(e)}/> */}
							<Select
								className='location'
								options={locationsAll.location.map(({label, value})=>({label, value}) )}
								onChange={e => handleEditChange(e)}
							/>
              <input id={data.leaflet_id} name={"submit-addlandmark"} type={"submit"} onClick={e=>handleEditChange(e)}/>
            </Popup>
            <Marker 
              key={data.leaflet_id}
              position={[data.latitude, data.longitude]} 
              icon={locationChecker(data.landmark_type)}
            />
          </FeatureGroup>
          ))}
        </div>
      )
    }

    else if (subpage == "#removelandmark"){
      RemoveLandmarkFn(landmarks, editedNodes, setEditedNodes)
    }
    else if (subpage == "#editlandmark"){
      EditLandmarkFn(landmarks, editedNodes, setEditedNodes)
    }

    else if (subpage == "#addroads"){
      AddRoads(allNodes)
    }
  }

  
  // // console.log(nodesAll.nodes)
  // useEffect(()=>{
  //   setNodes(nodesAll.nodes)
  // },[])

  // // handles addition of road
  // useEffect(()=>{
  //   if (currRoad != null){
  //     setRoads((prev) => [...prev, currRoad])
  //   }
  // },[currRoad])

  // useEffect(()=>{
  //   if (currNode != null){
  //     setNodes((prev) => [...prev, currNode])
  //   }
  // },[currNode])

  // HANDLES EDITING AND DRAWING OF MAP
  const DrawMap = () => {
    let map = useMap()  

    // if(mode==="intersection"){
    //   map.pm.enableDraw('Marker')
    //   console.log("drawing marker")

    //   map.on('pm:create', (e) => {
    //     let thisInter = {
    //       leaflet_id: e.layer._leaflet_id,
    //       landmark_type: "intersection",
    //       location: null,
    //       latitude: e.layer._latlng.lat,
    //       longitude: e.layer._latlng.lng,
    //     }

    //     setCurrNode(thisInter)
    //   })
    // }

    // else if (mode === "roads"){
    //   map.pm.enableDraw('Line')
    //   console.log("drawing line")

    //   map.on('pm:create', (e) => {
    //     console.log(e)
    //     var lastVertex = e.layer._latlngs.at(-1)
    //     var firstVertex = e.layer._latlngs[0]
    //     var endMarker =  allNodes.find(({latitude, longitude}) => latitude == lastVertex.lat && longitude == lastVertex.lng)
    //     var startMarker = allNodes.find(({latitude, longitude}) => latitude == firstVertex.lat && longitude == firstVertex.lng)
    //     if (endMarker && startMarker){
    //       var newRoad = {
    //         leaflet_id: e.layer._leaflet_id,  
    //         endPointA: startMarker.id,
    //         endpointB: endMarker.id, 
    //         latlngs: e.layer._latlngs
    //       }
    //       CALL API ---------------------------
    //       createRoads(newRoad)
    //     } else {
    //       e.target.removeLayer(e.layer)
    //     }
    //   })
      map.pm.enableGlobalRemovalMode()
      map.on('pm:remove', (e) => {
        console.log(e)
        let targetId = e.layer._leaflet_id
        
        let toRemove = roads.findIndex(({leaflet_id})=>leaflet_id==targetId)
  
        if(toRemove !== -1){
          roads.splice(toRemove,1)
          console.log(roads)
          // return
        }
      });

      console.log(roads)
    // }
    

    // ADDS EDIT CONTROLS
    // map.pm.addControls({  
    //   position: 'topright',  
    // });  
    
    return null
  }

  // MAPS LANDMARK ID TO LEAFLET ID
  // leaflet ID is essential for rendering

  const RenderRoads = () => {
    let map = useMap()
    const purpleOptions = { color: 'white', weight: 5 }
    const lightTraffic = {color: 'white'}
    return(
      roads?.map((road) =>{

        let allPositions = road.latitudes.map((latitude,index) => 
          [latitude,road.longitudes[index]])
        let id = +road.id

        
        return(
          <FeatureGroup>
            {subpage==="#updatetraffic"? 
              <Popup>
              <div className = "changestatus">
                <b>Change Status to:</b>
                <div className = "tbutton-container">
                  <button className = "lightwrapper">
                    <div className = "trafficstatus-light"></div>
                    <small className = "light">Light</small>    
                  </button>
                  <button className = "modwrapper">
                    <div className = "trafficstatus-moderate"></div>
                    <small className = "moderate">Moderate</small>  
                  </button>
                  <button className = "heavywrapper">
                    <div className = "trafficstatus-heavy"></div>
                    <small className = "heavy">Heavy</small>   
                  </button>
                </div>
              </div>
            </Popup>
            :<></>}
          <Polyline key={id} pathOptions={purpleOptions} positions={allPositions}/>
          </FeatureGroup>

        )
      })

  
      
      // edgesOld?.map((road)=>{
      //   return(
      //     <Polyline key={road.leaflet_id} pathOptions={purpleOptions} positions={road.latlngs} />
      //   )
      // })

      // edges?.map((road)=>{
      //   let allPositions = road.latitude.map((lat, index) => {
      //     return {lat: lat, lng:road.longitude[index]}
      //   })
      //   return(
      //     <Polyline key={road.leaflet_id} pathOptions={purpleOptions} positions={road.latlngs} />
      //   )
      // })
    )

    
  }

  const RenderShortPath = () => {
    const redOptions = { color: 'red', weight: 5 }
    console.log(path)

    return (
      path?.map((shortPath) => {

        let thisPath = shortPath.latitudes.map((latitude, index) =>
          [latitude, shortPath.longitudes[index]])
        let id = +shortPath.id

        return (
          <Polyline key={id} pathOptions={redOptions} positions={thisPath}>
          </Polyline>
        )
      }))}

    
  const RenderStartMarker = () => {
    console.log(path)
    if(path && path.length)
      return (
        <MarkerLayer
          data={{ landmark_type: "Start", latitude: path[0].latitudes[0], longitude: path[0].longitudes[0] }}
        />)
  }

  const RenderEndMarker = () => {
    console.log(path)
    if (path && path.length)
      return (
        <MarkerLayer
          data={{ landmark_type: "End", latitude: path.at(-1).latitudes.at(-1), longitude: path.at(-1).longitudes.at(-1)}}
        />)
  }

  // < MarkerLayer data={landmark_type: "Start"}/>

  // async function createNodes(){  
  //   console.log("HERE ")
  //   console.log(nodes)
  //   const response = await CreateNodes(nodes)

  //   console.log(response)
  //   if (response.data.status !== 201){
  //     console.log("FAILED")
  //   } else {
  //     console.log("SUCCESS")
  //   }

  // }

  // async function createRoads(){
  //   console.log("HERE ")
  //   console.log(edges)
  //   const response = await CreateRoads(edges)

  //   console.log(response)
  //   if (response.data.status !== 201){
  //     console.log("FAILED")
  //   } else {
  //     console.log("SUCCESS")
  //   }
  // }

  console.log(allNodes)
  
  // console.log(roads.map(x => [x.latlngs.map(y => [y.lat, y.lng])]))
  return(

    <div className="map-container">

      <SideBar/>
      <HandleSubpage/>

      <link 
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.0/dist/leaflet.css"
      />
      <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.css"/>
      <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>

      <MapContainer 
        center={[10.3157, 123.8854]} 
        zoom={9} 
        minZoom={9}
        scrollWheelZoom={true}
        closePopupOnClick={false}
        
      >
          {/* <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className='leaflet-tiles'
          />  */}

        {/* Renders the map */}
        <GeoJSON 
          data={CebuMap.features}
          className="cebu-outline"
        />
        
        {/* Renders markers*/}
        

        {/* <DrawMap/> */}
        
        <MapMarkerId/>
        {/* <HandleEditModes/> */}

        <HandleMode/>
        <RenderRoads/>
        {subpage==="#pathfinder"? 
          <div>

            <RenderShortPath/>    
            <RenderStartMarker/>
            <RenderEndMarker/>
          </div>
        :<></>
        }
        {landmarks?.map((landmark) =>{
          return(
            <MarkerLayer
            data = {landmark}
            />)
          })}
          <HandleMode/>

        {intersections?.map((landmark) => {
          return (
            <MarkerLayer
              data={landmark}
            />)
        })}


      </MapContainer>


      {/* <input onChange={e}>test</input> */}
      {/* <button onClick={() => setEditMode("add-landmarks")}>
        Add landmarks
      </button> */}
      {/* <button onClick={() => mode === "intersection"? setMode("normal"):setMode("intersection")}>
        Intersections mode toggle
      </button>
      <button onClick={() => setMode("roads")}>
        roads mode 
      </button>
      <button onClick={() => FetchNodes()}>
        Fetch landmarks
      </button>
      <button onClick={() => createNodes()}>
        Submit Nodes to API
      </button>
      <button onClick={()=> createRoads()}>
        Submit Roads to API
      </button> */}
      
      
      </div>
  )
}

export default Map;