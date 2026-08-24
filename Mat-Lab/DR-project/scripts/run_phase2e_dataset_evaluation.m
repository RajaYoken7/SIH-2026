%RUN_PHASE2E_DATASET_EVALUATION Evaluate signals across all quality pairs.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));
dataFolder = fullfile(projectRoot, 'data', 'allQuality');

metricNames = {'MeanBrightness', 'BrightnessStd', 'CoefficientOfVariation', ...
    'IlluminationUniformity', 'Contrast', 'BlurScore', 'EdgeDensity', ...
    'BrightnessIllumination', 'BlurDetail', 'EdgeDetail', ...
    'OverallQualityScore'};
higherIsBetter = [false, false, false, true, true, true, true, ...
    true, true, true, true];
weights = struct('BrightnessIllumination', 0.30, 'Contrast', 0.20, ...
    'BlurDetail', 0.25, 'EdgeDetail', 0.25);
directionDescriptions = { ...
    'target range; neither extreme is universally better', ...
    'lower variation is generally better', ...
    'lower relative variation is generally better', ...
    'higher uniformity is generally better', ...
    'higher contrast is generally better', ...
    'higher detail/sharpness is generally better', ...
    'higher detectable detail is generally better', ...
    'higher component score is better', ...
    'higher component score is better', ...
    'higher component score is better', ...
    'higher prototype score is better'};

fprintf('\nPHASE 2E - DATASET QUALITY EVALUATION\n');
fprintf('=======================================\n');
evaluation = evaluateQualityDataset(dataFolder, [], weights);
fprintf('Dataset folder: %s\n', dataFolder);
fprintf('Discovered files: %d total (%d GOOD, %d BAD)\n', ...
    numel(evaluation.Records), evaluation.GoodCount, evaluation.BadCount);
fprintf('Matched GOOD/BAD pairs: %d\n', numel(evaluation.Pairs));
fprintf('Existing Phase 2D weights: brightness %.2f, contrast %.2f, blur %.2f, edge %.2f\n', ...
    weights.BrightnessIllumination, weights.Contrast, weights.BlurDetail, weights.EdgeDetail);

summaries = summarizeQualityGroups(evaluation, metricNames);
analysis = analyzeMetricSeparation(summaries, metricNames, higherIsBetter);

fprintf('\nGOOD VS BAD GROUP STATISTICS\n');
fprintf('Metric                         N good mean       median      std       min       max\n');
for index = 1:numel(metricNames)
    printStats(metricNames{index}, summaries.GOOD.(metricNames{index}));
    printStats([metricNames{index} ' (BAD)'], summaries.BAD.(metricNames{index}));
end

fprintf('\nMETRIC SEPARATION ANALYSIS\n');
fprintf('Metric                         Good-Bad mean   Good-Bad median  Std sep  Higher  Direction\n');
for index = 1:numel(analysis)
    item = analysis(index);
    fprintf('%-30s %+14.4f %+17.4f %8.3f %-7s %s\n', item.Metric, ...
        item.MeanDifference, item.MedianDifference, item.StandardizedSeparation, ...
        item.HigherGroup, directionDescriptions{index});
    if item.DirectionContradictsExpectation
        fprintf('  WARNING: observed higher group contradicts the assumed direction.\n');
    end
end

fprintf('\nFUSION EVALUATION\n');
goodOverall = summaries.GOOD.OverallQualityScore;
badOverall = summaries.BAD.OverallQualityScore;
if max(goodOverall.Min, badOverall.Min) <= min(goodOverall.Max, badOverall.Max)
    fprintf('Overall-score ranges overlap: YES\n');
else
    fprintf('Overall-score ranges overlap: NO\n');
end
higherPairedCount = sum([evaluation.Pairs.GoodScore] > [evaluation.Pairs.BadScore]);
fprintf('Pairs where GOOD overall score is higher: %d/%d\n', ...
    higherPairedCount, numel(evaluation.Pairs));

fprintf('\nPAIRED COMPARISON RESULTS\n');
for index = 1:numel(evaluation.Pairs)
    pair = evaluation.Pairs(index);
    fprintf('%s: GOOD %.2f vs BAD %.2f (%s)\n', pair.PairId, ...
        pair.GoodScore, pair.BadScore, higherLabel(pair.GoodScore, pair.BadScore));
end

fprintf('\nPROTOTYPE CALIBRATION RECOMMENDATIONS\n');
for index = 1:numel(analysis)
    item = analysis(index);
    absoluteSeparation = abs(item.StandardizedSeparation);
    if ~isfinite(absoluteSeparation) || min(summaries.GOOD.(item.Metric).Count, ...
            summaries.BAD.(item.Metric).Count) < 5
        category = 'Needs more data';
    elseif item.DirectionContradictsExpectation || absoluteSeparation < 0.25
        category = 'Weak or inconsistent signal';
    elseif absoluteSeparation >= 1
        category = 'Strong candidate';
    else
        category = 'Useful supporting signal';
    end
    fprintf('%-30s %-28s mean separation %+0.4f; %s\n', item.Metric, ...
        category, item.MeanDifference, recommendationReason(item));
end
fprintf(['Current Phase 2D weights were evaluated as implemented; they were not ', ...
    'automatically changed. Future weight changes should be tested on larger ', ...
    'independently labelled data.\n']);

figure('Name', 'Phase 2E Group Component Means', 'Color', 'w');
plotNames = {'BrightnessIllumination', 'Contrast', 'BlurDetail', 'EdgeDetail', ...
    'OverallQualityScore'};
groupMeans = zeros(2, numel(plotNames));
for index = 1:numel(plotNames)
    groupMeans(:, index) = [summaries.GOOD.(plotNames{index}).Mean; ...
        summaries.BAD.(plotNames{index}).Mean];
end
bar(groupMeans);
xticks(1:2); xticklabels({'GOOD', 'BAD'});
ylabel('Prototype score (0-100)');
title('GOOD vs BAD component means');
legend(plotNames, 'Interpreter', 'none', 'Location', 'best');
grid on;

figure('Name', 'Phase 2E Overall Score Distribution', 'Color', 'w');
boxplot([[goodOverallValues(evaluation)]', [badOverallValues(evaluation)]'], ...
    'Labels', {'GOOD', 'BAD'});
ylabel('Overall prototype quality score (0-100)');
title('Overall score distributions');
grid on;

if ~isempty(evaluation.Pairs)
    figure('Name', 'Phase 2E Paired Overall Scores', 'Color', 'w');
    pairedValues = [[evaluation.Pairs.GoodScore]' [evaluation.Pairs.BadScore]'];
    plot(pairedValues', '-o');
    xticks([1 2]); xticklabels({'GOOD', 'BAD'});
    ylabel('Overall prototype quality score (0-100)');
    title('Paired GOOD vs BAD overall scores');
    grid on;
end

fprintf(['These results are based on the available engineering dataset and are ', ...
    'not clinical validation. A larger, independently labelled dataset is ', ...
    'required before selecting production thresholds or claiming diagnostic ', ...
    'performance.\n']);

function printStats(label, stats)
fprintf('%-30s %1d %9.4f %11.4f %9.4f %9.4f %9.4f\n', label, ...
    stats.Count, stats.Mean, stats.Median, stats.Std, stats.Min, stats.Max);
end

function values = goodOverallValues(evaluation)
values = [evaluation.Records(strcmp({evaluation.Records.Group}, 'GOOD')).OverallQualityScore];
end

function values = badOverallValues(evaluation)
values = [evaluation.Records(strcmp({evaluation.Records.Group}, 'BAD')).OverallQualityScore];
end

function label = higherLabel(goodScore, badScore)
if goodScore > badScore
    label = 'GOOD higher';
elseif badScore > goodScore
    label = 'BAD higher';
else
    label = 'tied';
end
end

function reason = recommendationReason(item)
if item.DirectionContradictsExpectation
    reason = 'observed direction contradicts assumed quality direction';
elseif abs(item.StandardizedSeparation) < 0.25
    reason = 'small standardized group separation';
else
    reason = 'observed direction agrees with the assumed quality direction';
end
end
