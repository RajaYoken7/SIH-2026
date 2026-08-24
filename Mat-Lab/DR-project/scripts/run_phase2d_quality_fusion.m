%RUN_PHASE2D_QUALITY_FUSION Compare fused prototype scores on one pair.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));

dataFolder = fullfile(projectRoot, 'data', 'allQuality');
fileNames = {'1_good.JPG', '1_bad.JPG'};
weights = struct('BrightnessIllumination', 0.30, 'Contrast', 0.20, ...
    'BlurDetail', 0.25, 'EdgeDetail', 0.25);
allScores = zeros(numel(fileNames), 5);

fprintf('\nPHASE 2D - QUALITY SCORE FUSION\n');
fprintf('================================\n');
fprintf(['Engineering prototype only. Scores use fixed reference ranges and ', ...
    'are not clinically validated.\n']);
fprintf(['Full-dataset evaluation is required before selecting production or ', ...
    'clinical thresholds.\n\n']);

for index = 1:numel(fileNames)
    imagePath = fullfile(dataFolder, fileNames{index});
    if ~isfile(imagePath)
        error('run_phase2d_quality_fusion:FileNotFound', ...
            'Expected dataset image was not found: %s', imagePath);
    end

    processed = preprocessFundusImage(imagePath);
    qualityMetrics = calculateQualityMetrics(processed.Gray);
    illuminationMetrics = calculateIlluminationMetrics(processed.Gray);
    edgeMetrics = calculateEdgeDensity(processed.Gray);
    qualityMetrics.MeanBrightness = illuminationMetrics.MeanBrightness;
    qualityMetrics.IlluminationUniformity = illuminationMetrics.IlluminationUniformity;
    qualityMetrics.EdgeDensity = edgeMetrics.EdgeDensity;

    scores = calculateQualityScores(qualityMetrics);
    fused = fuseQualityScores(scores, weights);
    allScores(index, :) = [scores.BrightnessIllumination, scores.Contrast, ...
        scores.BlurDetail, scores.EdgeDetail, fused.OverallQualityScore];

    fprintf('%s\n', fileNames{index});
    fprintf('  Brightness/illumination: %.2f / 100\n', scores.BrightnessIllumination);
    fprintf('  Contrast:                %.2f / 100\n', scores.Contrast);
    fprintf('  Blur/detail:             %.2f / 100\n', scores.BlurDetail);
    fprintf('  Edge/detail:             %.2f / 100\n', scores.EdgeDetail);
    fprintf('  Overall quality score:   %.2f / 100\n', fused.OverallQualityScore);
    fprintf('  Weights: brightness %.2f, contrast %.2f, blur %.2f, edge %.2f\n\n', ...
        fused.WeightsUsed.BrightnessIllumination, fused.WeightsUsed.Contrast, ...
        fused.WeightsUsed.BlurDetail, fused.WeightsUsed.EdgeDetail);
end

figure('Name', 'Phase 2D Quality Score Fusion', 'Color', 'w');
bar(allScores);
xticks(1:numel(fileNames));
xticklabels(fileNames);
ylim([0 100]);
ylabel('Prototype quality score (0-100)');
title('Independent component scores and fused overall score');
legend({'Brightness/illumination', 'Contrast', 'Blur/detail', ...
    'Edge/detail', 'Overall'}, 'Location', 'best');
grid on;

fprintf(['The fused score summarizes independent signals; it does not diagnose ', ...
    'disease or prove that one quality label is correct.\n']);
