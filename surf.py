import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt
# Load the image
img = cv.imread('image.png')
gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
# Initialize SURF detector
surf = cv.xfeatures2d.SURF_create()
# Detect keypoints and descriptors
keypoints, descriptors = surf.detectAndCompute(gray, None)
# Draw keypoints on the image
img_with_keypoints = cv.drawKeypoints(img, keypoints, None, (255, 0, 0), flags=cv.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
# Display the image with keypoints
plt.imshow(img_with_keypoints)
plt.show()
