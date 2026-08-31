   %RUN_PHASE2B_ILLUMINATION_ANALYSIS Compare illumination on one quality pair.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));

dataFolder = fullfile(projectRoot, 'data', 'allQuality');
fileNames = {'1_good.JPG', '1_bad.JPG'};

fprintf('\nPHASE 2B - ILLUMINATION VALIDATION\n');
fprintf('==================================\n');
fprintf(['Initial two-image comparison only. GOOD/BAD labels describe overall ', ...
    'quality, not illumination alone.\n']);
fprintf(['Metrics use the non-black fundus region; no threshold or clinical ', ...
    'claim is made.\n\n']);

for index = 1:numel(fileNames)
    imagePath = fullfile(dataFolder, fileNames{index});
    if ~isfile(imagePath)
        error('run_phase2b_illumination_analysis:FileNotFound', ...
            'Expected dataset image was not found: %s', imagePath);
    end

    processed = preprocessFundusImage(imagePath);
    metrics = calculateIlluminationMetrics(processed.Gray);

    fprintf('%s\n', fileNames{index});
    fprintf('  Mean brightness: %.6f (valid-region intensity, 0 to 1)\n', ...
        metrics.MeanBrightness);
    fprintf('  Brightness variation: %.6f (valid-region standard deviation)\n', ...
        metrics.BrightnessStd);
    fprintf('  Coefficient of variation: %.6f (variation relative to mean)\n', ...
        metrics.CoefficientOfVariation);
    fprintf('  Illumination uniformity: %.6f (higher means more even)\n', ...
        metrics.IlluminationUniformity);
    fprintf('  Valid retinal-region fraction: %.2f%%\n\n', ...
        100 * metrics.ValidPixelFraction);
end

fprintf(['Interpretation: compare these measurements with visual inspection. ', ...
    'A BAD image need not be worse on every illumination metric.\n']);
fprintf(['Full-dataset evaluation is required before selecting any production ', ...
    'threshold.\n']);
