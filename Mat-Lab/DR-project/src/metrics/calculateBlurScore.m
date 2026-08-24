function blurScore = calculateBlurScore(grayImage)
%CALCULATEBLURSCORE Measure image detail using variance of the Laplacian.
%   BLURSCORE = CALCULATEBLURSCORE(GRAYIMAGE) returns a numeric score for a
%   non-empty 2-D grayscale image. The score is a sharpness-related signal:
%   higher values indicate more high-frequency detail (a sharper image),
%   while lower values indicate more blur. The score is not a percentage.
%
%   The image is converted to double before filtering so uint8, integer,
%   floating-point, and logical image inputs are handled consistently.

if ~(isnumeric(grayImage) || islogical(grayImage)) || ...
        ndims(grayImage) ~= 2 || isempty(grayImage)
    error('calculateBlurScore:InvalidInput', ...
        'Input must be a non-empty 2-D grayscale image.');
end

imageAsDouble = im2double(grayImage);

% The Laplacian responds strongly to edges and fine detail. Blur suppresses
% those responses, so their variance provides an explainable blur signal.
laplacianKernel = [0 1 0; 1 -4 1; 0 1 0];
laplacianImage = imfilter(imageAsDouble, laplacianKernel, 'replicate');
blurScore = var(laplacianImage(:));
end
