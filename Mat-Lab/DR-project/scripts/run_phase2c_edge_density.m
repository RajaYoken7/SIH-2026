%RUN_PHASE2C_EDGE_DENSITY Compare retinal edge detail on one quality pair.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));

dataFolder = fullfile(projectRoot, 'data', 'allQuality');
fileNames = {'1_good.JPG', '1_bad.JPG'};
edgeMetrics = cell(size(fileNames));

fprintf('\nPHASE 2C - EDGE DENSITY VALIDATION\n');
fprintf('==================================\n');
fprintf(['Edge density is the proportion of valid fundus-region pixels found ', ...
    'by the Canny detector. Higher values generally mean more detected ', ...
    'structural detail.\n']);
fprintf(['Initial two-image comparison only. GOOD/BAD labels describe overall ', ...
    'quality, not edge density alone.\n\n']);

figureHandle = figure('Name', 'Phase 2C Edge Density', 'Color', 'w');
tiledlayout(2, 2, 'Padding', 'compact', 'TileSpacing', 'compact');
for index = 1:numel(fileNames)
    imagePath = fullfile(dataFolder, fileNames{index});
    if ~isfile(imagePath)
        error('run_phase2c_edge_density:FileNotFound', ...
            'Expected dataset image was not found: %s', imagePath);
    end

    processed = preprocessFundusImage(imagePath);
    edgeMetrics{index} = calculateEdgeDensity(processed.Gray);

    fprintf('%s\n', fileNames{index});
    fprintf('  Edge density: %.6f (edge pixels / valid-region pixels)\n', ...
        edgeMetrics{index}.EdgeDensity);
    fprintf('  Edge pixels: %d\n', edgeMetrics{index}.EdgePixelCount);
    fprintf('  Valid fundus-region fraction: %.2f%%\n\n', ...
        100 * edgeMetrics{index}.ValidPixelFraction);

    nexttile;
    imshow(processed.Gray);
    title(sprintf('%s - grayscale', fileNames{index}), 'Interpreter', 'none');
    nexttile;
    imshow(edgeMetrics{index}.EdgeMap);
    title(sprintf('%s - masked Canny edges', fileNames{index}), ...
        'Interpreter', 'none');
end

fprintf(['Interpretation: inspect the edge maps to confirm that detected edges ', ...
    'correspond mainly to retinal structures, not the outer black background.\n']);
fprintf(['A BAD image may have higher edge density if it still contains sharp ', ...
    'structures despite other quality problems.\n']);
fprintf(['Full-dataset evaluation is required before selecting thresholds or ', ...
    'drawing quality conclusions.\n']);

if ~ishghandle(figureHandle)
    error('run_phase2c_edge_density:VisualizationUnavailable', ...
        'The edge visualization could not be created.');
end
