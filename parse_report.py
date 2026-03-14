#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import sys
import argparse
import os

def parse_junit_report(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Error: Report file '{file_path}' not found.")
        return 1

    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        count = 0
        
        print(f"📊 Parsing report: {file_path}\n")
        
        for testcase in root.iter('testcase'):
            failures = list(testcase.iter('failure'))
            if failures:
                classname = testcase.attrib.get('classname', 'UnknownClass')
                name = testcase.attrib.get('name', 'UnknownTest')
                print(f"FAIL: {classname}.{name}")
                
                for failure in failures:
                    message = failure.attrib.get('message', 'No failure message provided')
                    print(f"  Reason: {message}")
                
                print("-" * 40)
                count += 1
        
        if count == 0:
            print("✅ All tests passed (no failures found in report).")
        else:
            print(f"Total failures parsed: {count}")
            
        return 0 if count == 0 else 1

    except ET.ParseError as e:
        print(f"❌ Error: Failed to parse XML in '{file_path}': {e}")
        return 1
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return 1

def main():
    parser = argparse.ArgumentParser(description="Parse JUnit XML test reports.")
    parser.add_argument("file", nargs="?", default="report.xml", help="Path to the XML report (default: report.xml)")
    args = parser.parse_args()
    
    sys.exit(parse_junit_report(args.file))

if __name__ == "__main__":
    main()
