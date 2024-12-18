import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt

# Load the two images
img1 = cv.imread('image.png', cv.IMREAD_GRAYSCALE)  # Query image
img2 = cv.imread('image6_addidasTshirt.webp', cv.IMREAD_GRAYSCALE)  # Train image

# Initialize ORB detector
orb = cv.ORB_create()

# Detect keypoints and descriptors with ORB
keypoints1, descriptors1 = orb.detectAndCompute(img1, None)
keypoints2, descriptors2 = orb.detectAndCompute(img2, None)

# Create BFMatcher object
bf = cv.BFMatcher(cv.NORM_HAMMING, crossCheck=True)

# Match descriptors
matches = bf.match(descriptors1, descriptors2)

# Sort matches by distance (lower distance is better)
matches = sorted(matches, key=lambda x: x.distance)

# Draw first 20 matches (for visualization)
img_matches = cv.drawMatches(img1, keypoints1, img2, keypoints2, matches[:20], None, flags=cv.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

# Display the matches
plt.imshow(img_matches)
plt.show()
