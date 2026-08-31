%RUN_PHASE1 Run the Phase 1 fundus image quality assessment.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));
addpath(fullfile(projectRoot, 'config'));

% Change this path to assess another image.
inputPath = fullfile(projectRoot, 'data', 'allQuality/', '18_good.JPG');

processed = preprocessFundusImage(inputPath);
metrics = calculateQualityMetrics(processed.Gray);
decision = classifyImageQuality(metrics, qualityThresholds());

fprintf('\nIMAGE QUALITY ASSESSMENT\n');
fprintf('-------------------------\n');
fprintf('Image: %s\n', inputPath);
fprintf('Brightness: %.2f\n', metrics.Brightness);
fprintf('Contrast: %.2f\n', metrics.Contrast);
fprintf('Sharpness: %.2f\n', metrics.Sharpness);
fprintf('FINAL DECISION: %s\n', decision.Label);
fprintf('Confidence (prototype): %.0f%%\n', decision.Confidence * 100);
fprintf('Reason: %s\n', decision.Reasons{1});

figure('Name', 'Phase 1 Image Quality Assessment', 'Color', 'w');
tiledlayout(2, 2, 'Padding', 'compact', 'TileSpacing', 'compact');
nexttile; imshow(processed.Original); title('Original Image');
nexttile; imshow(processed.Gray); title('Grayscale Image');
nexttile; imshow(processed.Enhanced); title('CLAHE Enhanced Image');
nexttile; axis off;
text(0, 0.85, sprintf('Brightness: %.2f', metrics.Brightness), 'FontSize', 12);
text(0, 0.65, sprintf('Contrast: %.2f', metrics.Contrast), 'FontSize', 12);
text(0, 0.45, sprintf('Sharpness: %.2f', metrics.Sharpness), 'FontSize', 12);
text(0, 0.20, sprintf('FINAL DECISION: %s', decision.Label), ...
    'FontSize', 14, 'FontWeight', 'bold');
