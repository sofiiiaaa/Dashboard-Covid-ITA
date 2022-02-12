const map = L.map('map').setView([41.9, 12.5], 6);
const layerName = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const url = "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni-latest.json";
const day = document.getElementById('today')
const info = L.control();
const today = new Date().toLocaleDateString("it-IT");
day.innerHTML = today

const legend = L.control({position: 'bottomright'});
let geojson;

L.tileLayer(layerName, {attribution}).addTo(map);

const covid_dashboard = () => {
    axios.get(url)
                .then((raw)=> raw.data)
                .then(data => {console.log('data:', data,); return data})
                .then( (data) =>{
                    let matching;
                    for (let i=0; i<Italy.features.length; i++){
                        matching = data.filter((ele) => ele.codice_regione === Italy.features[i].properties.reg_istat_code_num)               
                        if (matching.length===0){
                            let the_two_regions = data.filter((ele)=> (ele.codice_regione===21|| ele.codice_regione===22))
                            Italy.features[i].properties.nuovi_positivi= the_two_regions[0].nuovi_positivi + the_two_regions[1].nuovi_positivi ;
                            Italy.features[i].properties.nuovi_positivi_prop = Italy.features[i].properties.nuovi_positivi / Italy.features[i].properties.population 
                        }
                        else{
                            Italy.features[i].properties.nuovi_positivi= matching[0].nuovi_positivi;                     
                            Italy.features[i].properties.ricoverati_con_sintomi= matching[0].ricoverati_con_sintomi;  
                            Italy.features[i].properties.totale_positivi= matching[0].totale_positivi;
                            Italy.features[i].properties.ingressi_terapia_intensiva= matching[0].ingressi_terapia_intensiva;      
                            Italy.features[i].properties.deceduti= matching[0].deceduti;     
                            Italy.features[i].properties.variazione_totale_positivi= matching[0].variazione_totale_positivi;                                
                            Italy.features[i].properties.nuovi_positivi_prop = Italy.features[i].properties.nuovi_positivi / Italy.features[i].properties.population                
                        }
                                       
                    }  
                    return Italy  
                })                    
                .then((italyCovid)=> {
                     geojson = L.geoJson(italyCovid,{style: style, onEachFeature: onEachFeature}).addTo(map)
                })
                   
                     
                .catch((err) => alert(err))       
                
                
            }
            
window.onload = covid_dashboard
    
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

info.update = function (props) {
    let str = '';
    if (props){
        str = (
            "<b>" + props.reg_name + "</b>"+
            "<br/>" + "Nuovi positivi: " + props.nuovi_positivi  +
            "<br/>" + "Variazione totale positivi: " + props.variazione_totale_positivi  +
            "<br/>" + "Positivi su popolazione: " + Math.round(props.nuovi_positivi_prop * 1000)/1000    +
            "<br/>" + "Ingressi terapia intensiva: " + props.ingressi_terapia_intensiva  +
            "<br/>" + "Popolazione: " + props.population
        )
    }
    else{
        str = "Seleziona una regione <br/>per vedere i dettagli."
    }
    this._div.innerHTML = '<h4>Situazione COVID</h4>' + str 
        
};

info.addTo(map);

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: (e) => {
            e.target.setStyle({weight: 7, color: 'white', dashArray: '2', fillOpacity: 1})
            info.update(layer.feature.properties);
        },
        mouseout: (e) => {geojson.resetStyle(e.target)},
        click: (e) =>  map.fitBounds(e.target.getBounds())
    });
}

function getColor (d) {
    let col;
    d = d*100
    if (d < 0.5) col = '#F94144'
    if (d < 0.4) col = '#F9AF37'
    if (d < 0.35) col = '#F9C74F'
    if (d < 0.30) col = '#DFC557'
    if (d < 0.25) col = '#c5c35e'
    if (d < 0.2) col = '#90BE6D'
    if (d < 0.15) col = '#ABC166'
    if (d < 0.10) col = '#BCC361'
    if (d < 0.05) col = 'white'
    if (!col) col = 'black'
    return col
}

function style (feature) {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '0',
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.nuovi_positivi_prop)
    };
}

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    var grades = [0.0005, 0.0010, 0.0015, 0.0020, 0.0025, 0.0030, 0.0035, 0.004, 0.005];
    var labels = ["<div style='margin-bottom:10px!important;text-align:center'><span >Positivi su pop</span></div>"];
    var from, to;
    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];
        labels.push(
            '<i style="background:' + getColor(from) + '"></i>'+ from + (to ? '&ndash;' + to  : '+'));            
    }

    div.innerHTML = labels.join('<br/>');
    return div;
};

legend.addTo(map)
