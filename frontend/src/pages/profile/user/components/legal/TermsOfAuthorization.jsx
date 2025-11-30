// src/components/legal/TermsOfAuthorization.jsx
import React from "react";

const TERMS_OF_AUTHORIZATION = `
Terms of Authorization (Delegated User Access) 
Last updated: 11/21/2025

These Terms of Authorization (“Terms of Authorization”) explain how a primary account owner (“User”) may authorize another individual (“Authorized User”) to act on their behalf within the TaskPal platform operated by TaskPal (“we”, “us”, or “our”).

By enabling delegated access, the User confirms that they understand and accept these Terms of Authorization, in addition to our main Terms of Use and Privacy Policy.

1. Purpose
These Terms of Authorization govern how a User may grant limited permissions to an Authorized User to carry out certain actions on the User’s behalf, such as:
• Contacting Service Providers
• Managing or making bookings
• Other permitted functions made available on the platform

By granting authorization, the User acknowledges:
• They are responsible for selecting and supervising the Authorized User.
• Actions taken by the Authorized User within the granted permissions are treated as if performed by the User.

2. Definitions
“User”: The original account holder who owns the profile and grants authorization.  
“Authorized User”: The individual granted limited permission to act on the User’s behalf.  
“Service Provider”: Any vendor, freelancer, or entity offering services on the platform.  
“Platform”: The application or website operated by TaskPal, including APIs.  
“Authorization Record”: A timestamped log of the granted permission, scope, and duration.

3. Relationship to Other Terms & Policies  
3.1 These Terms supplement our Terms of Use and Privacy Policy.  
3.2 If there is conflict, the main Terms of Use override.  
3.3 All Users and Authorized Users must comply with all TaskPal policies.

4. Scope of Authorization  
4.1 The User may define permissions such as:
• Viewing Service Providers  
• Sending messages  
• Making or managing bookings  
• Confirming or canceling services  

4.2 The Authorized User may NOT:
• Modify sensitive account data  
• Change account ownership  
• Transfer funds unless explicitly allowed  
• Misrepresent themselves beyond their granted scope  

4.3 Permissions are logged with timestamps.  
4.4 Actions may be labeled “on behalf of [User]” in UI and logs.

5. Duration and Expiration  
5.1 Authorization is temporary.  
5.2 If no expiry is set, it defaults to 30 days.  
5.3 Times are stored in UTC.  
5.4 User can revoke at any time.  
5.5 Revocation does not cancel existing bookings.

6. Revocation and Termination  
6.1 User may revoke access anytime.  
6.2 All delegated sessions are terminated immediately.  
6.3 We may revoke authorization if suspicious activity is found.  
6.4 We may disable delegation features to prevent misuse.

7. Accountability  
7.1 User is responsible for all Authorized User actions.  
7.2 Actions taken within permissions are treated as User actions.  
7.3 Platform is not liable for misuse of properly granted access.

8. Verification and Security  
Authorized Users must verify identity before activation.  
Logs include timestamps, IP, device info, and all activity.  
We may require additional verification for sensitive actions.

9. Notifications  
Users receive notifications for key actions such as messages, bookings, payments.

10. Liability and Disputes  
We are not responsible for losses caused by an Authorized User acting within authorized permissions.  
Unauthorized misuse may result in suspension or investigation.

11. Recordkeeping  
We maintain Authorization Records including:
• Grantor  
• Grantee  
• Permissions  
• Start/end timestamps  
• Device/IP metadata  

Records may be immutable for compliance.

12. Amendments  
We may update these Terms; continued use means acceptance.

13. Eligibility  
Users must legally be able to grant authorization.  
Authorized Users must be trusted individuals.

14. Caregivers and Legal Representatives  
Authorized access does not replace legal power of attorney.

15. Data Access and Privacy  
Authorized Users may see limited User information based on permissions.

16. Third-Party Services  
Service Providers are independent; TaskPal does not act as legal agent.

17. Safety and Emergency Use  
Platform cannot be used for emergencies.

18. Multiple Authorizations  
Only one active Authorized User is allowed unless specified otherwise.

19. Governing Law  
These Terms are governed by applicable jurisdiction law.
`;

const TermsOfAuthorization = () => {
  return (
    <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
      {TERMS_OF_AUTHORIZATION}
    </div>
  );
};

export default TermsOfAuthorization;
