function analysis = analyzeMetricSeparation(summaries, metricNames, higherIsBetter)
%ANALYZEMETRICSEPARATION Compare GOOD and BAD metric distributions.
%   ANALYSIS = ANALYZEMETRICSEPARATION(SUMMARIES, METRICNAMES,
%   HIGHERISBETTER) reports mean/median differences, pooled-standard-
%   deviation separation, observed direction, and expectation conflicts.
%   A metric with a target range should use false for HIGHERISBETTER and
%   document that neither extreme is universally better.

analysis = struct('Metric', {}, 'GoodMean', {}, 'BadMean', {}, ...
    'MeanDifference', {}, 'GoodMedian', {}, 'BadMedian', {}, ...
    'MedianDifference', {}, 'StandardizedSeparation', {}, ...
    'HigherGroup', {}, 'HigherIsBetter', {}, 'DirectionContradictsExpectation', {});
for index = 1:numel(metricNames)
    name = metricNames{index};
    good = summaries.GOOD.(name);
    bad = summaries.BAD.(name);
    item = struct();
    item.Metric = name;
    item.GoodMean = good.Mean;
    item.BadMean = bad.Mean;
    item.MeanDifference = good.Mean - bad.Mean;
    item.GoodMedian = good.Median;
    item.BadMedian = bad.Median;
    item.MedianDifference = good.Median - bad.Median;
    pooledStd = sqrt((good.Std ^ 2 + bad.Std ^ 2) / 2);
    if isfinite(pooledStd) && pooledStd > 0
        item.StandardizedSeparation = item.MeanDifference / pooledStd;
    else
        item.StandardizedSeparation = NaN;
    end
    if item.MeanDifference > 0
        item.HigherGroup = 'GOOD';
    elseif item.MeanDifference < 0
        item.HigherGroup = 'BAD';
    else
        item.HigherGroup = 'TIED';
    end
    item.HigherIsBetter = higherIsBetter(index);
    item.DirectionContradictsExpectation = item.HigherIsBetter && ...
        strcmp(item.HigherGroup, 'BAD') || ...
        ~item.HigherIsBetter && strcmp(item.HigherGroup, 'GOOD');
    analysis(end + 1) = item;
end
end
