import React, { useState, useEffect, useRef } from 'react';

import { Button, Slider } from '@material-ui/core';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import PublicIcon from '@material-ui/icons/Public';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import ToggleButton from '@material-ui/lab/ToggleButton';

import { mapCountriesToPlotData, mapIndiaApiResponseToPlotData, mapToFinalPlotData, mapToPlotData, mapToSelectedLocChartSeries } from '../mappers/chart-view.mapper';
import { retrieveCoronaWorldReports, retrieveCoronaIndiaStats } from '../api/corona.data.service';
import { StackedLine } from './StackedLine';
import { ChartSettingsModal} from './ChartSettingsModal';
import { ChartJsData, FinalPlotData, SelectedSettings } from '../models/chart.model';
import { LineChart } from './LineChart';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';

const initialStackedData = {
  dates: [''],
  locStatMap: {},
};

// const retrieveChartSeries = async (mode) => {
//   let chartSeries
//   if (mode === 'India') {
//     const indiaStats = await retrieveCoronaIndiaStats();
//     chartSeries = mapIndiaStatToChartSeries(indiaStats);
//   } else {
//     const worldStats = await retrieveCoronaWorldReports();
//     chartSeries = mapWorldStatToChartSeries(worldStats);
//   }
//   return chartSeries
// }
export function Dashboard() {

  const sliderRef = useRef();
  const persistedLocs = localStorage.getItem('selectedLocs');
  const persistedApiTypes = persistedLocs ? localStorage.getItem('apiTypes') : null;
  const [selectedSetttings, setSelectedSettings] = useState<SelectedSettings>({
     selectedApiTypes: ['india', 'international'],
     selectedLocations: [23, 15,33, 215]
  })
  const [finalPlotData, setFinalPlotData] = useState<FinalPlotData>();
  const [chartJsData, setChartJsData] = useState<ChartJsData>({labels: [], datasets:[]});
  // const [selectedLocs, SetSelectedLocs] = useState(persistedLocs && persistedMode ? persistedLocs.split(',') : ['Delhi', 'Kerala']);
  // const [chartSeries, setChartSeries] = useState(initialStackedData);
  // const [selectedLocSeries, setSelectedLocSeries] = useState({dates:[], series:[{name:'', data: []}]});
  // const [selectedDate, setSelectedDate] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filters, setFilters] = useState();
  // async function _setChartDataBasedOnMode(tempMode = null) {
  //   const chartSeries = await retrieveChartSeries(tempMode ? tempMode : locationType);
  //   setChartSeries(chartSeries);
  // };
  useEffect(() => {
    async function initiateCoronaStats() {
      const dataSets = await Promise.all([
        retrieveCoronaWorldReports(),
        retrieveCoronaIndiaStats()
      ]);
      const plotData = mapToPlotData(dataSets[0], dataSets[1]);
      const finalPlotData = mapToFinalPlotData(selectedSetttings, plotData);
      console.log('plotData', plotData);
      setFinalPlotData(finalPlotData);
    }
    initiateCoronaStats();
  }, []);
  // animation play and pause
   useEffect(() => {
     let interval: any;
     if (!isPlaying) {
       clearInterval(interval);
       return;
     }
     let newValue = 1;
     interval = setInterval(() => {
        newValue = newValue + 1;
        setChartJsData(
          {
            labels: finalPlotData?.dates.slice(0, newValue) || [],
            datasets: finalPlotData?.datasetList.map((dataset) => ({
              ...dataset,
              data: dataset.data.slice(0, newValue) || []
            })) || []
          }
        )
     }, 600);
    //  if (!isPlaying || sliderValue === selectedLocSeries?.dates.length) {
    //    clearInterval(interval);
    //  }
     return () => clearInterval(interval);
   },[sliderValue, isPlaying, finalPlotData])

  // const sliderLabelFormat = (value) => selectedLocSeries.dates[value - 1];

  // const onSliderChange =(event, index) => {
  //   setSliderValue(index);
  //   setSelectedDate(selectedLocSeries.dates[index - 1]);
  // };
  const onModalOpen = () => {
    // _setChartDataBasedOnMode();
    setIsSettingsOpen(true); 
    setIsPlaying(false);
  }
  const onModalClose = () => {
    setIsSettingsOpen(false);
  }
  
  // const onApplySettings = ({mode, selectedLocs}) => {
  //   setIsSettingsOpen(false);
  //   const selectedLocSeries = mapToSelectedLocChartSeries(
  //     selectedLocs,
  //     chartSeries
  //   );
  //   setSelectedLocSeries(selectedLocSeries);
  //   setSelectedDate(chartSeries.dates[0]);
  //   setSliderValue(1);
  //   setFilters(mode);
  //   SetSelectedLocs(selectedLocs);
  //   setIsPlaying(true);
  //   localStorage.setItem('selectedFilters', mode)
  //   localStorage.setItem('selectedLocs', selectedLocs);
  // }

   return (
     <div className="chart-container">
       {
         <>
         <div className="add-countries">
          <Button
            className="add-country-btn"
            onClick={onModalOpen}
            variant="contained"
            color="default"
            endIcon={<PublicIcon></PublicIcon>}
          >
            +
        </Button>
       </div>
        <div className="stacked-line">
          {finalPlotData && <LineChart
            chartJsDataset={chartJsData}
          />}
        </div>
        </>
       /* <div className="stacked-line">
         <StackedLine
           categories={selectedLocSeries.dates}
           series={selectedLocSeries.series}
           index={sliderValue}
           mode={locationType}
         ></StackedLine>
       </div>
       <div className="footer">
         <div className="play-pause">
           <ToggleButtonGroup
             value={isPlaying}
             exclusive
             onChange={(e, v) => setIsPlaying(v)}
             aria-label="text alignment"
           >
             <ToggleButton value={true} aria-label="play">
               <PlayArrowIcon />
             </ToggleButton>
             <ToggleButton value={false} aria-label="play">
               <PauseIcon />
             </ToggleButton>
           </ToggleButtonGroup>
         </div>
         <div className="slider-with-date">
           <div style={{ width: '95%', 'marginLeft': 10 }}>
              <Slider
                min={0}
                value={sliderValue}
                defaultValue={1}
                max={selectedLocSeries?.dates?.length}
                ref={sliderRef}
                valueLabelDisplay="off"
                onChange={onSliderChange}
                valueLabelFormat={sliderLabelFormat}
              />
            </div>
            <div className="slider-selected-date">{selectedDate}</div>
          </div>
       </div> */}
       <ChartSettingsModal
        mode={filters}
        isModalOpen={isSettingsOpen}
        selectedLocs={selectedSetttings.selectedLocations}
        locations={[]}
        onModalClose={onModalClose}
        onApplySettings={() => {}}
        onModeChange={() =>{} }
       ></ChartSettingsModal>
     </div> 
   );
}