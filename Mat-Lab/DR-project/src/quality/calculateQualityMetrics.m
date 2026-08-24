function metrics = calculateQualityMetrics(grayImage)
%CALCULATEQUALITYMETRICS Calculate brightness, contrast, and sharpness.
%   METRICS = CALCULATEQUALITYMETRICS(GRAYIMAGE) returns a struct with
%   intensity-based quality metrics for a 2-D grayscale image.

if ~(isnumeric(grayImage) || islogical(grayImage)) || ndims(grayImage) ~= 2 || isempty(grayImage)
    error('calculateQualityMetrics:InvalidInput', ...
        'Input must be a non-empty 2-D grayscale image.');
end

imageAsDouble = double(grayImage);
metrics = struct();
metrics.Brightness = mean(imageAsDouble(:));
metrics.Contrast = std(imageAsDouble(:));

% Exclude black borders and near-white artifacts from the retinal brightness estimate.
foregroundPixels = imageAsDouble(imageAsDouble > 15 & imageAsDouble < 245);
if isempty(foregroundPixels)
    metrics.ForegroundBrightness = metrics.Brightness;
else
    metrics.ForegroundBrightness = mean(foregroundPixels);
end

laplacianFilter = fspecial('laplacian', 0.2);
laplacianImage = imfilter(imageAsDouble, laplacianFilter, 'replicate');
metrics.Sharpness = var(laplacianImage(:));
metrics.BlurScore = calculateBlurScore(grayImage);
end
