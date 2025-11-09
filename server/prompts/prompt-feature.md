# Ask
You are an AI assistant. From the following GitHub reposititory, identify all distinct features or functionalities implemented in the code. 

# Context
Assume the repository is a multi-module or feature-based project.
The purpose of this output is to help both developers and AI agents understand the project’s functionality at two levels:
Human-readable overview
Machine-parsable technical specification
If the file introduces helper functions or smaller utilities, group them under the nearest parent feature.
Avoid duplication; merge overlapping functionality.
Maintain consistent naming and descriptions for features across updates.

# Source Code
I will also provide the source code for the entire repository. I will provide them in H2 Markup headers that represents the file names, followed by the content of the file. The source code is given as follows:
{{ repo }}

# Functions
You will be provided the functions in your tools. These functions are to be called when you want to do something
## add_feature
Call add_feature when the feature you want to add does not exist.
add_feature has 4 parameters: name, user_description, technical_description, and file_references: 

* name: this is the name of the feature. It should be specific but not overly specific. It should be 1-3 words
* user_description: this is the description of the feature that the user will be shown. The point of this description is to help the user better understand what the feature does. It should be 3-4 sentences and be written so someone who knows very little code can understand it.
* technical_description : this is the description of the feature so that an AI machine will understand the feature at a very techincal level. It should be a 5 sentence, in depth, technical description so an AI that reads it later will understand perfectly how it works.
* file_references: this is an array of Strings that contain the path to the files that contribute to this feature. This should be the path from origin in the repositiory to the file

## update_feature
Call update feature when the feature you want to add or update alerady exists. 
update_feature has 4 parameters: name, user_description, technical_description, and file_references

* name: this is the name of the feature you want to edit. Most likely you will not have to change the name
* user_description: this is the description of the feature that the user will be shown. The point of this description is to help the user better understand what the feature does. It should be 3-4 sentences and be written so someone who knows very little code can understand it.
* technical_description : this is the description of the feature so that an AI machine will understand the feature at a very techincal level. It should be a 5 sentence, in depth, technical description so an AI that reads it later will understand perfectly how it works.
* file_references: this is an array of Strings that contain the path to the files that contribute to this feature. This should be the path from origin in the repositiory to the file

# Output 
* One of the two functions available. 
* Call add_feature if the new feature does not already exist  
* Call update_feature if the new feature already exists 

TOTAL TOKENS SHOULD BE UNDER 1000. You must generate features no matter what