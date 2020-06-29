# Created by Era Iyer
# June 2020
# update.py file
# parses through csv NYT data, creates json file with state, dates, total cases, 
# new cases, and rolling average cases 

# also, determines appropriate color representation based on data 
#                   regarding daily new coronavirus cases  
#
# winning = green
# nearly there = orange
# needs action = red
#
# methods to determine color representation:
#   1. green --> current average < 10 OR current average < 20  and current avrage < 0.5*peak
#   2. orange --> current average < 1.5*20 and current average < peak*0.5 
#                 OR current average < peak*0.2
#   3. red --> all other cases 


import csv
import json

import pandas as pd
us_states = ["Alaska", "Alabama", "Arkansas", "American Samoa", "Arizona", "California", "Colorado", "Connecticut", 
            "District of Columbia", "Delaware", "Florida", "Georgia", "Guam", "Hawaii", "Iowa", "Idaho", "Illinois", 
            "Indiana", "Kansas", "Kentucky", "Louisiana", "Massachusetts", "Maryland", "Maine", "Michigan", "Minnesota",
            "Missouri", "Mississippi", "Montana", "North Carolina", "North Dakota", "Nebraska", "New Hampshire", 
            "New Jersey", "New Mexico", "Nevada", "New York", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", 
            "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Virginia", "Virgin Islands", 
            "Vermont", "Washington", "Wisconsin", "West Virginia", "Wyoming"]
dates = []
states = []
total_cases = []
total_deaths = []

url = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
data = pd.read_csv(url)

for index, row in data.iterrows():
    dates.append(row['date'])
    states.append(row['state'])
    total_cases.append(row['cases'])
    total_deaths.append(row['deaths'])

arr = []
for idx, val in enumerate(us_states):
    total_cases1 = []
    total_deaths1 = []
   # state_dict = {"state":val, "dates": [], "total_cases": [], "new_cases": [], "avg_cases": [], "total_deaths": [], "new_deaths": [], "avg_deaths": []}
    state_dict = {"state":val, "dates": [], "new_cases": [], "avg_cases": [], "new_deaths": [], "avg_deaths": []}
    for i, states_name in enumerate(states):
        if states[i] == val: 
            state_dict["dates"].append(dates[i])
            # state_dict["total_cases"].append(total_cases[i])
            # state_dict["total_deaths"].append(total_deaths[i])
            total_cases1.append(total_cases[i])
            total_deaths1.append(total_deaths[i])
   # for i, case_val in enumerate(state_dict["total_cases"]):
    for i, case_val in enumerate(total_cases1):
        new_cases = 0
        if i > 0:
            # new_cases = state_dict["total_cases"][i] - state_dict["total_cases"][i-1]
            new_cases = total_cases1[i] - total_cases1[i-1]
        if new_cases < 0:
                new_cases = 0
        #special case, fixing error from Michigan data on 6/5
        if state_dict["state"] == 'Michigan' and state_dict["dates"][i] == '2020-06-05':
            new_cases = 284
        state_dict["new_cases"].append(new_cases)
    # for i, death_val in enumerate(state_dict["total_deaths"]): 
    for i, death_val in enumerate(total_deaths1): 
        new_deaths = 0
        if i > 0:
            # new_deaths = state_dict["total_deaths"][i] - state_dict["total_deaths"][i-1]
            new_deaths = total_deaths1[i] - total_deaths1[i-1]
        if new_deaths < 0:
            new_deaths = 0
        state_dict["new_deaths"].append(new_deaths)

    window = 7
    numbers_series = pd.Series(state_dict["new_cases"], dtype="float64")
    avg_series = numbers_series.rolling(window=window, min_periods=1, center=True).mean()
    moving_averages_list = avg_series.tolist()
    state_dict["avg_cases"] = moving_averages_list

    numbers_series = pd.Series(state_dict["new_deaths"], dtype="float64")
    avgDeath_series = numbers_series.rolling(window=window, min_periods=1, center=True).mean()
    moving_averages_list = avgDeath_series.tolist()
    state_dict["avg_deaths"] = moving_averages_list

    arr.append(state_dict)


#result.json stores the states, dates, and corresponding values
with open('result.json', 'w') as fp:
    json.dump(arr, fp)


#parallel arrays to store json information 
province = []
values = []
countries = []
setColors = []
allWeekValues = []
peakCases = []
all_moving_averages = []
F0 = 0.5
F1 = 0.2
N0 = 20

colors = ["green", "orange", "red"]
daysToAverage = 7

with open('./result.json') as f:
    data = json.load(f)
    for i in data:
        #filling parallel arrays with province, values, country 
        province.append(i['state'])
        values.append(i['new_cases'])
        all_moving_averages.append(i['avg_cases'])

#another parallel array that stores each province's max number of cases 
for i in range(len(all_moving_averages)):
    
    max = 0
    for j in range(len(all_moving_averages[i])):
        if(all_moving_averages[i][j]>max):
            max = all_moving_averages[i][j]
    peakCases.append(max)

#simplifies values array to hold just values from the past week (per province/state)
for k in range(len(values)):
    #gets values from last 7 days 
    start = len(values[k])-daysToAverage
    end = len(values[k])
    stateWeekVals = []
    if(start < 0): #edge case, if data has less than 7 values
        start = 0

    for i in range(start, end):
        stateWeekVals.append(values[k][i])
    #array of array of new cases per week per state
    allWeekValues.append(stateWeekVals)


for i in range(len(allWeekValues)):
    sum = 0
    for k in range(len(allWeekValues[i])):
        sum += allWeekValues[i][k]
    average = sum/daysToAverage

    if((average < (N0 * F0)) or ((average < N0) and (average < (peakCases[i]*F0)))):
        setColors.append(colors[0])
    elif(((average < (1.5*N0)) and (average < (peakCases[i]*F0))) or (average < (peakCases[i]*F1))):
         setColors.append(colors[1])
    else: 
         setColors.append(colors[2])


with open('USStateColors.csv', 'w', newline='') as file:
    fieldnames = ['state', 'color']
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    for i in range(len(province)):
        writer.writerow({'state': province[i], 'color': setColors[i]})