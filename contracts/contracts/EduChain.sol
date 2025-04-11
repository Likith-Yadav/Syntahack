// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EduChain is Ownable {
    // Structs
    struct Institution {
        string name;
        string location;
        bool isActive;
        address institutionAddress;
    }
    
    struct Credential {
        string credentialId;
        string studentName;
        string institutionName;
        string courseName;
        uint256 issueDate;
        uint256 expiryDate;
        bool isRevoked;
        address issuer;
        address student;
    }
    
    // Mappings
    mapping(address => Institution) public institutions;
    mapping(string => Credential) public credentials;
    mapping(address => string[]) public studentCredentials;
    
    // Counter variables
    uint256 private _institutionCount;
    uint256 private _credentialCount;
    
    constructor() Ownable(msg.sender) {}
    
    // Events
    event InstitutionRegistered(address indexed institutionAddress, string name);
    event CredentialIssued(string indexed credentialId, address indexed student, address indexed issuer);
    event CredentialRevoked(string indexed credentialId);
    event CredentialVerified(string indexed credentialId, bool isValid);
    
    // Modifiers
    modifier onlyInstitution() {
        require(institutions[msg.sender].isActive, "Not a registered institution");
        _;
    }
    
    // Functions
    function registerInstitution(string memory _name, string memory _location) public {
        require(!institutions[msg.sender].isActive, "Institution already registered");
        
        institutions[msg.sender] = Institution({
            name: _name,
            location: _location,
            isActive: true,
            institutionAddress: msg.sender
        });
        
        _institutionCount++;
        emit InstitutionRegistered(msg.sender, _name);
    }
    
    function issueCredential(
        address _student,
        string memory _studentName,
        string memory _courseName,
        uint256 _expiryDate
    ) public onlyInstitution {
        string memory credentialId = string(abi.encodePacked(
            institutions[msg.sender].name,
            "-",
            _studentName,
            "-",
            _courseName,
            "-",
            Strings.toString(_credentialCount)
        ));
        
        credentials[credentialId] = Credential({
            credentialId: credentialId,
            studentName: _studentName,
            institutionName: institutions[msg.sender].name,
            courseName: _courseName,
            issueDate: block.timestamp,
            expiryDate: _expiryDate,
            isRevoked: false,
            issuer: msg.sender,
            student: _student
        });
        
        studentCredentials[_student].push(credentialId);
        _credentialCount++;
        
        emit CredentialIssued(credentialId, _student, msg.sender);
    }
    
    function revokeCredential(string memory _credentialId) public onlyInstitution {
        require(credentials[_credentialId].issuer == msg.sender, "Not the original issuer");
        require(!credentials[_credentialId].isRevoked, "Credential already revoked");
        
        credentials[_credentialId].isRevoked = true;
        emit CredentialRevoked(_credentialId);
    }
    
    function verifyCredential(string memory _credentialId) public view returns (bool) {
        Credential memory credential = credentials[_credentialId];
        
        if (credential.issuer == address(0)) {
            return false;
        }
        
        if (credential.isRevoked) {
            return false;
        }
        
        if (block.timestamp > credential.expiryDate) {
            return false;
        }
        
        return true;
    }
    
    function getStudentCredentials(address _student) public view returns (string[] memory) {
        return studentCredentials[_student];
    }
    
    function getInstitutionCount() public view returns (uint256) {
        return _institutionCount;
    }
    
    function getCredentialCount() public view returns (uint256) {
        return _credentialCount;
    }
} 