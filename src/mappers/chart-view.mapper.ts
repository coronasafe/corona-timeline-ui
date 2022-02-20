import * as _ from 'lodash';
import { CountryAPIResponse, IndiaApiResponse } from '../api/api.model';
import { ApiDateRange, ChartJsDatset, DropDownOptions, MissingDataPoint, PlotData } from '../components/chart.model';

export const mapCountriesToPlotData = (data: CountryAPIResponse): PlotData  => {
    const dates = _.map(_.sample(data), 'date');
    const datasetList: ChartJsDatset[] = _.map(data, (report, key) => {
        return {
            label: key.replace(',',''),
            data: _.map(report, 'confirmed'),
            borderColor: '',
            backgroundColor: '',
            tension: 0.5,
            apiType: 'international'
        }
    });
    return { apiType:'international', dates, datasetList };
}

export const mapCountriesToDropDown = (countryStat: CountryAPIResponse): DropDownOptions[] => {
    return _.map(_.keys(countryStat), (country, index) => ({
        label: country,
        value: index,
    }));
}
export const mapCountryNames = (countryStat: CountryAPIResponse): string[] => {
    return _.keys(countryStat);
}

export const mapPlaceFilterToDropDownOptions = (places: string[]) => {
    return places.map((place, index) => {
        return {
            label: place,
            value: index
        }
    })
}

export const mapIndiaApiResponseToPlotData = (indiaApiResponse: IndiaApiResponse): PlotData => {
    const dates = indiaApiResponse.data.map(d => d.day);
    const initialStateLookup: {[key: string]: {name: string, data: number[]}}  = _.chain(indiaApiResponse)
                                .get('data', [])
                                .map('regional')
                                .flatten()
                                .map('loc').uniq()
                                .map(state => ({name: state, data:[]}))
                                .keyBy('name').value();

    const locStatMap = indiaApiResponse.data.reduce((lookup, data, i) => {
        data.regional.forEach((region) => {
            lookup[region.loc].data.push(region.totalConfirmed);
        })
        
        // add previous totalConfirmed || 0 for missing state data
        _.each(lookup, (lookupItem) => {
            lookup[lookupItem.name] = !!lookupItem.data[i] 
            ? lookupItem 
            : { ...lookupItem, data: [...lookupItem.data, lookupItem.data[i-1] || 0]}
        });
        return lookup;
    }, initialStateLookup);
    const datasetList: ChartJsDatset[] = _.map(locStatMap, (dataset) => {
        return {
            label: dataset.name,
            data: dataset.data,
            borderColor: '',
            backgroundColor: '',
            tension: 0.5,
            apiType: 'india'
        }
    })
    return {dates, apiType: 'india', datasetList};
}

export const mapToMissingDataPoints = (plotDataList: PlotData[]): MissingDataPoint[] => {
    const allDates: string[] =  _.chain(plotDataList).flatMap('dates').uniq().sort().value();
    const apiDateRange: ApiDateRange[] = plotDataList.map(({apiType, dates}) => {
        return {
            apiType,
            startDate: _.head(dates) || '',
            endDate: _.last(dates)|| ''
        };
    }); 

    return _mapApiDateRangeToMissingDataPoint(apiDateRange, allDates);
}
const _mapApiDateRangeToMissingDataPoint = (apiDateRange: ApiDateRange[], dates: string[]): MissingDataPoint[] => {
   return apiDateRange.map((dateRange): MissingDataPoint => {
        return {
            apiType: dateRange.apiType,
            prependNullCount: _.findIndex(dates, dateRange.startDate) + 1,
            appendNullCount: _.findIndex(dates, dateRange.endDate) + 1
        }
    })   
}

export const mapToProcessedPlotData = (plotDataList: PlotData[], missingDataPoints: MissingDataPoint[]): PlotData[] => {
    return plotDataList.map((plotData: PlotData): PlotData => {
        const missingDataPoint = missingDataPoints.find((missingDataPoint) => missingDataPoint.apiType === plotData.apiType);
        return {
            ...plotData,
            datasetList: plotData.datasetList.map(dataSet => {
                return {
                    ...dataSet,
                    data: _.concat(
                        _.fill(Array(missingDataPoint?.prependNullCount || 0), null), 
                        dataSet.data,
                        _.fill(Array(missingDataPoint?.appendNullCount || 0), null), 
                    )
                }
            })
        }
    });
}

export const mapToSelectedLocChartSeries = (selectedPlaces: any, chartSeries: any) => {
  const series =   _.map(selectedPlaces, (country) => {
    return  chartSeries.locStatMap[country];
    });
  return {dates: chartSeries.dates, series};
}
