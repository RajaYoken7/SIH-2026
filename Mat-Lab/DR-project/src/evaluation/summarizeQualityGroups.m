function summaries = summarizeQualityGroups(evaluation, metricNames)
%SUMMARIZEQUALITYGROUPS Calculate descriptive statistics by quality group.
%   SUMMARIES = SUMMARIZEQUALITYGROUPS(EVALUATION, METRICNAMES) returns
%   count, mean, median, standard deviation, minimum, and maximum for each
%   requested signal in GOOD and BAD records.

if nargin < 2 || isempty(metricNames)
    metricNames = defaultMetricNames();
end

groups = {'GOOD', 'BAD'};
summaries = struct();
for groupIndex = 1:numel(groups)
    groupName = groups{groupIndex};
    groupRecords = evaluation.Records(strcmp({evaluation.Records.Group}, groupName));
    groupSummary = struct();
    for metricIndex = 1:numel(metricNames)
        metricName = metricNames{metricIndex};
        values = extractMetricValues(groupRecords, metricName);
        stats = struct('Count', numel(values), 'Mean', NaN, 'Median', NaN, ...
            'Std', NaN, 'Min', NaN, 'Max', NaN);
        if ~isempty(values)
            stats.Mean = mean(values);
            stats.Median = median(values);
            stats.Min = min(values);
            stats.Max = max(values);
            if numel(values) > 1
                stats.Std = std(values);
            else
                stats.Std = 0;
            end
        end
        groupSummary.(metricName) = stats;
    end
    summaries.(groupName) = groupSummary;
end
end

function values = extractMetricValues(records, metricName)
values = [];
for index = 1:numel(records)
    if strcmp(metricName, 'OverallQualityScore')
        value = records(index).OverallQualityScore;
    elseif isfield(records(index).Metrics, metricName)
        value = records(index).Metrics.(metricName);
    elseif isfield(records(index).Scores, metricName)
        value = records(index).Scores.(metricName);
    else
        continue;
    end
    if isnumeric(value) && isscalar(value) && isfinite(value)
        values(end + 1) = value;
    end
end
end

function metricNames = defaultMetricNames()
metricNames = {'MeanBrightness', 'BrightnessStd', 'CoefficientOfVariation', ...
    'IlluminationUniformity', 'Contrast', 'BlurScore', 'EdgeDensity', ...
    'BrightnessIllumination', 'BlurDetail', 'EdgeDetail', ...
    'OverallQualityScore'};
end
