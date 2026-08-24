function results = testQualityPipeline()
%TESTQUALITYPIPELINE Run Phase 1 quality assessment on bundled samples.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));
addpath(fullfile(projectRoot, 'config'));

fileNames = {'fundus_clear_1.jpg', 'fundus_dark_1.jpg', 'fundus_blur_1.jpg'};
expectedLabels = {'GOOD', 'DARK', 'BLURRY'};
thresholds = qualityThresholds();
results = table('Size', [numel(fileNames), 7], ...
    'VariableTypes', {'string', 'double', 'double', 'double', 'string', 'string', 'logical'}, ...
    'VariableNames', {'Image', 'Brightness', 'Contrast', 'Sharpness', ...
    'Expected', 'Observed', 'MatchesExpected'});

fprintf('\nPHASE 1 SAMPLE TEST\n');
fprintf('===================\n');
for index = 1:numel(fileNames)
    imagePath = fullfile(projectRoot, 'data', 'Fundus', fileNames{index});
    processed = preprocessFundusImage(imagePath);
    metrics = calculateQualityMetrics(processed.Gray);
    decision = classifyImageQuality(metrics, thresholds);

    results.Image(index) = string(fileNames{index});
    results.Brightness(index) = metrics.Brightness;
    results.Contrast(index) = metrics.Contrast;
    results.Sharpness(index) = metrics.Sharpness;
    results.Expected(index) = string(expectedLabels{index});
    results.Observed(index) = string(decision.Label);
    results.MatchesExpected(index) = strcmp(decision.Label, expectedLabels{index});

    fprintf('%s | B %.2f | C %.2f | S %.2f | expected %s | observed %s\n', ...
        fileNames{index}, metrics.Brightness, metrics.Contrast, metrics.Sharpness, ...
        expectedLabels{index}, decision.Label);
end

fprintf('Matched expected labels: %d/%d\n', ...
    sum(results.MatchesExpected), height(results));
if ~all(results.MatchesExpected)
    fprintf(['Note: thresholds are prototype heuristics calibrated on only ', ...
        'three samples and are not medically validated.\n']);
end
end
