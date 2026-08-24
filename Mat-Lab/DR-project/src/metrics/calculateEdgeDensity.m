function metrics = calculateEdgeDensity(grayImage)
%CALCULATEEDGEDENSITY Measure visible structural detail in the fundus.
%   METRICS = CALCULATEEDGEDENSITY(GRAYIMAGE) detects Canny edges and
%   measures them only inside the valid non-black fundus region.
%
%   EdgeDensity is the proportion of valid-region pixels detected as edges.
%   Higher values generally indicate more detectable boundaries and
%   structural detail, while lower values may indicate reduced detail.
%   Edge density alone does not determine image quality and is not a
%   clinical measurement. EdgeMap and ValidMask are returned for review.

if ~(isnumeric(grayImage) || islogical(grayImage)) || ...
        ndims(grayImage) ~= 2 || isempty(grayImage)
    error('calculateEdgeDensity:InvalidInput', ...
        'Input must be a non-empty 2-D grayscale image.');
end

imageAsDouble = im2double(grayImage);
[validMask, maskThreshold] = createFundusRegionMask(imageAsDouble);
edgeMap = edge(imageAsDouble, 'Canny');
validPixelCount = nnz(validMask);

metrics = struct();
metrics.EdgeDensity = nnz(edgeMap & validMask) / validPixelCount;
metrics.EdgePixelCount = nnz(edgeMap & validMask);
metrics.ValidPixelFraction = validPixelCount / numel(validMask);
metrics.MaskThreshold = maskThreshold;
metrics.EdgeMap = edgeMap & validMask;
metrics.ValidMask = validMask;
end
